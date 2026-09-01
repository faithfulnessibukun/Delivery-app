-- ============================================================================
-- NewAge Delivery App — initial Supabase schema
-- ============================================================================
-- This migration reproduces, in PostgreSQL, everything the app currently
-- keeps in localStorage:
--
--   localStorage key   ->  table(s)
--   ----------------       --------------------------------------------------
--   users              ->  profiles          (1 row per auth user)
--   categories         ->  categories        (was a flat string[] per vendor)
--   menus              ->  menu_items
--   cart               ->  carts + cart_items
--   orders             ->  orders + order_items  (food delivery)
--   courierOrders      ->  courier_orders        (package delivery)
--   useMockData        ->  stays client-side only (dev toggle, not data)
--
-- Auth is handled by Supabase Auth (auth.users). `profiles` hangs off it.
-- Every "who did this" column is a FK to profiles(id), which is itself
-- auth.users(id). We never store passwords — Supabase Auth owns those.
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums — the string vocabularies the app already uses, pinned down so a
-- typo can't create a new "status" the UI doesn't know how to render.
-- ---------------------------------------------------------------------------

-- users[].role
create type user_role as enum ('customer', 'vendor', 'rider');

-- orders[].status — the restaurant's progress (set in VendorOrders.jsx)
create type order_status as enum ('Placed', 'Preparing', 'Ready', 'Cancelled');

-- orders[].deliveryStatus — the rider's progress on a food order
-- (set in utils/deliverypool.js + RiderDashboard.jsx)
create type food_delivery_status as enum (
  'Waiting for restaurant to confirm order',
  'Accepted by Rider',
  'Picked Up',
  'Out for Delivery',
  'Delivered'
);

-- courierOrders[].status — one field carries both "restaurant-side" and
-- "rider-side" progress for package deliveries
create type courier_status as enum (
  'Waiting for Rider',
  'Rider Assigned',
  'Out for Delivery',
  'Delivered'
);

create type package_size as enum ('Small', 'Medium', 'Large');

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- profiles  (was localStorage "users" + the three *CurrentUser keys)
-- ===========================================================================
-- One row per Supabase Auth user. `id` IS auth.users.id — same UUID, so a
-- profile row and its login are the same identity. The old app let one
-- person be "customer AND vendor AND rider at once" via three separate
-- localStorage keys; here a profile has ONE role. If you truly need
-- multi-role, see the note at the bottom of this file.
create table profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  role               user_role   not null default 'customer',
  full_name          text        not null,
  phone              text,
  -- vendor-only fields (null for customer/rider). Enforced by the CHECK below.
  restaurant_name    text,
  restaurant_address text,
  avatar_url         text,        -- was the base64 data-URL from VendorImageUpload
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint vendor_has_restaurant check (
    role <> 'vendor'
    or (restaurant_name is not null and restaurant_address is not null)
  )
);

create index profiles_role_idx on profiles (role);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row whenever someone signs up. The client passes
-- full_name / role / phone / restaurant_* in the signUp() `options.data`,
-- and they arrive here as raw_user_meta_data.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone, restaurant_name, restaurant_address)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'restaurant_name',
    new.raw_user_meta_data ->> 'restaurant_address'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ===========================================================================
-- categories  (was localStorage "categories": a flat string[] shared app-wide)
-- ===========================================================================
-- The old app kept ONE global list of category names. We scope it per
-- vendor so two restaurants can have their own "Drinks", "Specials", etc.
create table categories (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid not null references profiles (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),

  unique (vendor_id, name)   -- was the "Category already exists" check
);

create index categories_vendor_idx on categories (vendor_id);

-- ===========================================================================
-- menu_items  (was localStorage "menus")
-- ===========================================================================
-- The old objects duplicated restaurant_name / restaurant_address / vendor_name
-- onto every menu item so listings could be derived from the menu list alone.
-- Here that's a single FK to the vendor's profile; join to read those fields.
create table menu_items (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references profiles (id) on delete cascade,
  -- category is text, not a FK, on purpose: the old data lets an item keep a
  -- category string even if the vendor later renames/deletes the category,
  -- and MenuForm writes a free string. Swap to `category_id uuid references
  -- categories(id)` if you want referential integrity here.
  category    text not null,
  name        text not null,             -- was foodName / name / itemName (all the same value)
  price       numeric(10, 2) not null check (price >= 0),
  image_url   text,                      -- was image / itemImage (base64 data-URL)
  is_available boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index menu_items_vendor_idx on menu_items (vendor_id);
create index menu_items_category_idx on menu_items (vendor_id, category);

create trigger menu_items_set_updated_at
  before update on menu_items
  for each row execute function set_updated_at();

-- ===========================================================================
-- carts + cart_items  (was localStorage "cart": a flat array of line items)
-- ===========================================================================
-- One open cart per customer. The old cart array mixed the vendor/restaurant
-- onto every line; a cart here is implicitly single-vendor (the app only ever
-- checks cart[0].vendorId at checkout), enforced by a trigger below.
create table carts (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger carts_set_updated_at
  before update on carts
  for each row execute function set_updated_at();

create table cart_items (
  id              uuid primary key default gen_random_uuid(),
  cart_id         uuid not null references carts (id) on delete cascade,
  menu_item_id    uuid not null references menu_items (id) on delete cascade,
  quantity        integer not null check (quantity > 0),
  -- add-ons picked on the item detail page. The old shape was
  -- [{ name, price }, ...]; kept as jsonb because add-ons aren't a table yet
  -- (see data/addOns.js — they're a hardcoded generic list).
  add_ons         jsonb not null default '[]'::jsonb,
  -- price snapshot so a later menu price change doesn't silently
  -- re-price someone's cart. Base item price only; add-on prices live in add_ons.
  unit_price      numeric(10, 2) not null check (unit_price >= 0),
  added_at        timestamptz not null default now(),

  unique (cart_id, menu_item_id, add_ons)
);

create index cart_items_cart_idx on cart_items (cart_id);

-- Keep a cart single-vendor: every cart_item must belong to the same vendor
-- as the items already in that cart. (Matches the app's checkout assumption.)
create or replace function cart_items_single_vendor()
returns trigger
language plpgsql
as $$
declare
  new_vendor uuid;
  existing_vendor uuid;
begin
  select vendor_id into new_vendor from menu_items where id = new.menu_item_id;

  select mi.vendor_id into existing_vendor
  from cart_items ci
  join menu_items mi on mi.id = ci.menu_item_id
  where ci.cart_id = new.cart_id
  limit 1;

  if existing_vendor is not null and existing_vendor <> new_vendor then
    raise exception 'Cart already contains items from a different restaurant';
  end if;

  return new;
end;
$$;

create trigger cart_items_enforce_single_vendor
  before insert or update on cart_items
  for each row execute function cart_items_single_vendor();

-- ===========================================================================
-- orders + order_items  (was localStorage "orders" — FOOD delivery)
-- ===========================================================================
-- The old order object was one big blob: customer fields, vendor fields,
-- rider fields, GPS for both parties, an items[] array, two status strings.
-- Split here into the order (header) + order_items (lines), with the rider
-- half of the blob as nullable columns that fill in once a rider accepts.
create table orders (
  id               uuid primary key default gen_random_uuid(),

  -- --- who ordered -------------------------------------------------------
  customer_id      uuid references profiles (id) on delete set null,
  -- name/phone snapshotted at order time (old code stored "Guest" / "N/A"
  -- when no user; keep that behaviour by allowing null customer_id + text here)
  customer_name    text not null default 'Guest',
  customer_phone   text not null default 'N/A',

  -- --- which restaurant ------------------------------------------------
  vendor_id        uuid not null references profiles (id) on delete restrict,
  -- pickup address snapshot (old: order.pickupAddress, from the vendor)
  pickup_address   text,

  -- --- money -----------------------------------------------------------
  total            numeric(10, 2) not null check (total >= 0),

  -- --- restaurant-side status (VendorOrders.jsx) ----------------------
  status           order_status not null default 'Placed',

  -- --- rider-side of the delivery (null until a rider accepts) --------
  rider_id         uuid references profiles (id) on delete set null,
  rider_name       text,
  -- delivery fee the VENDOR sets when marking the order Ready
  rider_earnings   numeric(10, 2) check (rider_earnings is null or rider_earnings > 0),
  -- has the rider been paid out for this delivery yet (RiderDashboard earnings)
  rider_paid       boolean not null default false,
  delivery_status  food_delivery_status not null
                     default 'Waiting for restaurant to confirm order',

  -- --- live GPS (old: customerLatitude/Longitude, riderLatitude/Longitude)
  customer_latitude   double precision,
  customer_longitude  double precision,
  rider_latitude      double precision,
  rider_longitude     double precision,

  placed_at        timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- a rider can only be "paid" once they've actually got the job
  constraint rider_paid_needs_rider check (not rider_paid or rider_id is not null),
  -- earnings are only meaningful once the order is Ready / assigned
  constraint earnings_only_when_ready check (
    rider_earnings is null or status in ('Ready', 'Cancelled')
       or delivery_status <> 'Waiting for restaurant to confirm order'
  )
);

create index orders_customer_idx on orders (customer_id);
create index orders_vendor_idx   on orders (vendor_id);
create index orders_rider_idx    on orders (rider_id);
-- "deliveries available to be offered" = Ready + no rider yet (deliverypool.js)
create index orders_offer_pool_idx on orders (status, rider_id)
  where status = 'Ready' and rider_id is null;

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders (id) on delete cascade,
  -- keep the menu item link, but SET NULL if the vendor later deletes it —
  -- the order line still needs to render (name/price are snapshotted below).
  menu_item_id  uuid references menu_items (id) on delete set null,
  name          text not null,                 -- snapshot of menu_items.name
  unit_price    numeric(10, 2) not null check (unit_price >= 0),  -- snapshot
  quantity      integer not null check (quantity > 0),
  add_ons       jsonb not null default '[]'::jsonb   -- [{ name, price }, ...]
);

create index order_items_order_idx on order_items (order_id);

-- ===========================================================================
-- courier_orders  (was localStorage "courierOrders" — PACKAGE delivery)
-- ===========================================================================
-- No line items — a courier order is a single package with a pickup and a
-- drop-off. One `status` column carries the whole lifecycle. The rider sets
-- the fee when they accept (unlike food orders, where the vendor sets it).
create table courier_orders (
  id                  uuid primary key default gen_random_uuid(),

  -- --- who booked it --------------------------------------------------
  customer_id         uuid references profiles (id) on delete set null,
  customer_name       text not null default 'Guest',
  customer_phone      text not null default 'N/A',

  -- --- the job -------------------------------------------------------
  pickup_address      text not null,
  destination_address text not null,
  package_size        package_size not null default 'Small',

  -- --- money (rider sets this on accept) ---------------------------
  delivery_fee        numeric(10, 2) check (delivery_fee is null or delivery_fee > 0),
  rider_paid          boolean not null default false,

  -- --- lifecycle --------------------------------------------------
  status              courier_status not null default 'Waiting for Rider',

  -- --- rider (null until assigned) ------------------------------
  rider_id            uuid references profiles (id) on delete set null,
  rider_name          text,
  assigned_at         timestamptz,

  -- --- live GPS ------------------------------------------------
  customer_latitude   double precision,
  customer_longitude  double precision,
  rider_latitude      double precision,
  rider_longitude     double precision,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint courier_assigned_has_rider check (
    status = 'Waiting for Rider' or rider_id is not null
  ),
  constraint courier_fee_set_when_assigned check (
    status = 'Waiting for Rider' or delivery_fee is not null
  ),
  constraint courier_rider_paid_needs_rider check (not rider_paid or rider_id is not null)
);

create index courier_orders_customer_idx on courier_orders (customer_id);
create index courier_orders_rider_idx    on courier_orders (rider_id);
create index courier_orders_offer_pool_idx on courier_orders (status, rider_id)
  where status = 'Waiting for Rider' and rider_id is null;

create trigger courier_orders_set_updated_at
  before update on courier_orders
  for each row execute function set_updated_at();

-- ===========================================================================
-- NOTE ON MULTI-ROLE ACCOUNTS
-- ===========================================================================
-- The current app supports one human being customer + vendor + rider at the
-- same time (three separate *CurrentUser localStorage keys). This schema
-- gives each auth user ONE role. Options if you need the old behaviour:
--
--   1. Drop `profiles.role`, add a `user_roles (user_id, role)` join table
--      (PK (user_id, role)); a user can then hold several roles. RLS policies
--      switch from `profiles.role = 'x'` to `exists (select 1 from user_roles
--      where user_id = auth.uid() and role = 'x')`.
--   2. Keep one role per account and let a person create separate accounts
--      (simplest; matches how most real delivery apps actually work).
--
-- Recommendation: option 2 unless there's a real product reason for one login
-- to be a vendor and a rider simultaneously.
-- ===========================================================================
