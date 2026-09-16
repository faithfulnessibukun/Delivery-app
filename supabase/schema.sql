-- ============================================================================
--  Delivery-app — Supabase schema
-- ============================================================================
--  HOW TO RUN THIS:
--    1. Open your Supabase project dashboard
--    2. Left sidebar -> "SQL Editor" -> "New query"
--    3. Paste this whole file, click "Run"
--  Safe to run more than once (uses "if not exists" / "drop ... if exists").
--
--  This schema matches the tables/columns the React app actually queries
--  (src/utils/supabaseStorage.js, src/lib/supabase.js call sites in
--  Login.jsx, MenuForm.jsx, CustomerHome.jsx, RiderDashboard.jsx, etc).
--  Earlier drafts of this file (auth-only) and firewall/migrations/*.sql
--  (a differently-named schema) are superseded by this one.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. users — one row per person, mirrors auth.users(id)
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id         uuid        primary key references auth.users (id) on delete cascade,
  full_name  text        not null default '',
  email      text        not null default '',
  phone      text        not null default '',
  role       text        not null default 'customer'
                          check (role in ('customer', 'vendor', 'rider')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

drop policy if exists "users: read all" on public.users;
create policy "users: read all"
  on public.users for select
  using (true);

drop policy if exists "users: update own" on public.users;
create policy "users: update own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users: insert own" on public.users;
create policy "users: insert own"
  on public.users for insert
  with check (auth.uid() = id);


-- ----------------------------------------------------------------------------
-- 2. customers / vendors / riders — role-specific extension tables
-- ----------------------------------------------------------------------------
create table if not exists public.customers (
  customer_id uuid primary key references public.users (id) on delete cascade,
  lat         double precision,
  lng         double precision
);

alter table public.customers enable row level security;

drop policy if exists "customers: owner all" on public.customers;
create policy "customers: owner all"
  on public.customers for all
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

create table if not exists public.vendors (
  vendor_id     uuid primary key references public.users (id) on delete cascade,
  business_name text not null default ''
);

alter table public.vendors enable row level security;

drop policy if exists "vendors: public read" on public.vendors;
create policy "vendors: public read"
  on public.vendors for select
  using (true);

drop policy if exists "vendors: owner writes" on public.vendors;
create policy "vendors: owner writes"
  on public.vendors for all
  using (auth.uid() = vendor_id)
  with check (auth.uid() = vendor_id);

create table if not exists public.riders (
  rider_id       uuid primary key references public.users (id) on delete cascade,
  license_number text,
  vehicle_type   text,
  vehicle_plate  text
);

alter table public.riders enable row level security;

drop policy if exists "riders: owner all" on public.riders;
create policy "riders: owner all"
  on public.riders for all
  using (auth.uid() = rider_id)
  with check (auth.uid() = rider_id);


-- ----------------------------------------------------------------------------
-- 3. restaurants — one per vendor
-- ----------------------------------------------------------------------------
create table if not exists public.restaurants (
  restaurant_id uuid        primary key default gen_random_uuid(),
  vendor_id     uuid        not null references public.vendors (vendor_id) on delete cascade,
  name          text        not null default '',
  address_line  text        not null default '',
  logo_url      text,
  created_at    timestamptz not null default now(),
  unique (vendor_id)
);

alter table public.restaurants enable row level security;

drop policy if exists "restaurants: public read" on public.restaurants;
create policy "restaurants: public read"
  on public.restaurants for select
  using (true);

drop policy if exists "restaurants: owner writes" on public.restaurants;
create policy "restaurants: owner writes"
  on public.restaurants for all
  using (auth.uid() = vendor_id)
  with check (auth.uid() = vendor_id);


-- ----------------------------------------------------------------------------
-- 4. categories — per-restaurant menu categories
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (restaurant_id) on delete cascade,
  name          text not null,
  unique (restaurant_id, name)
);

alter table public.categories enable row level security;

drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read"
  on public.categories for select
  using (true);

drop policy if exists "categories: owner writes" on public.categories;
create policy "categories: owner writes"
  on public.categories for all
  using (
    exists (
      select 1 from public.restaurants r
      where r.restaurant_id = categories.restaurant_id
        and r.vendor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.restaurants r
      where r.restaurant_id = categories.restaurant_id
        and r.vendor_id = auth.uid()
    )
  );


-- ----------------------------------------------------------------------------
-- 5. menu_items
-- ----------------------------------------------------------------------------
create table if not exists public.menu_items (
  menu_item_id uuid        primary key default gen_random_uuid(),
  restaurant_id uuid       not null references public.restaurants (restaurant_id) on delete cascade,
  name         text        not null,
  category     text,
  price        numeric(10, 2) not null default 0 check (price >= 0),
  description  text,
  image_url    text,
  is_available boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists menu_items_restaurant_idx on public.menu_items (restaurant_id);

alter table public.menu_items enable row level security;

drop policy if exists "menu_items: public read" on public.menu_items;
create policy "menu_items: public read"
  on public.menu_items for select
  using (true);

drop policy if exists "menu_items: owner writes" on public.menu_items;
create policy "menu_items: owner writes"
  on public.menu_items for all
  using (
    exists (
      select 1 from public.restaurants r
      where r.restaurant_id = menu_items.restaurant_id
        and r.vendor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.restaurants r
      where r.restaurant_id = menu_items.restaurant_id
        and r.vendor_id = auth.uid()
    )
  );


-- ----------------------------------------------------------------------------
-- 6. cart_items — flat per-customer cart (no separate "carts" header table;
--    matches supabaseStorage.js which reads/writes cart_items directly)
-- ----------------------------------------------------------------------------
create table if not exists public.cart_items (
  id              uuid        primary key default gen_random_uuid(),
  customer_id     uuid        not null references public.customers (customer_id) on delete cascade,
  vendor_id       uuid        references public.vendors (vendor_id) on delete cascade,
  restaurant_name text,
  item_id         text,
  name            text        not null,
  price           numeric(10, 2) not null default 0,
  quantity        integer     not null default 1 check (quantity > 0),
  add_ons         jsonb       not null default '[]'::jsonb,
  image           text,
  added_at        timestamptz not null default now()
);

create index if not exists cart_items_customer_idx on public.cart_items (customer_id);

alter table public.cart_items enable row level security;

drop policy if exists "cart_items: owner all" on public.cart_items;
create policy "cart_items: owner all"
  on public.cart_items for all
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);


-- ----------------------------------------------------------------------------
-- 7. orders + order_items — food delivery
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  order_id           uuid        primary key default gen_random_uuid(),
  customer_id        uuid        references public.customers (customer_id) on delete set null,
  restaurant_id      uuid        not null references public.restaurants (restaurant_id) on delete restrict,
  rider_id           uuid        references public.riders (rider_id) on delete set null,

  status             text        not null default 'Placed'
                                  check (status in ('Placed', 'Preparing', 'Ready', 'Cancelled')),
  delivery_status    text        not null default 'Waiting for restaurant to confirm order'
                                  check (delivery_status in (
                                    'Waiting for restaurant to confirm order',
                                    'Accepted by Rider',
                                    'Picked Up',
                                    'Out for Delivery',
                                    'Delivered'
                                  )),
  delivery_address   text,

  customer_lat       double precision,
  customer_lng       double precision,
  rider_latitude     double precision,
  rider_longitude    double precision,

  subtotal           numeric(10, 2) not null default 0,
  delivery_fee       numeric(10, 2),
  total_price        numeric(10, 2) not null default 0,
  rider_paid         boolean     not null default false,

  placed_at          timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_restaurant_idx on public.orders (restaurant_id);
create index if not exists orders_rider_idx on public.orders (rider_id);
create index if not exists orders_offer_pool_idx on public.orders (status, rider_id)
  where status = 'Ready' and rider_id is null;

alter table public.orders enable row level security;

drop policy if exists "orders: involved parties read" on public.orders;
create policy "orders: involved parties read"
  on public.orders for select
  using (
    auth.uid() = customer_id
    or auth.uid() = rider_id
    or exists (
      select 1 from public.restaurants r
      where r.restaurant_id = orders.restaurant_id
        and r.vendor_id = auth.uid()
    )
  );

drop policy if exists "orders: customer create" on public.orders;
create policy "orders: customer create"
  on public.orders for insert
  with check (auth.uid() = customer_id);

drop policy if exists "orders: involved parties update" on public.orders;
create policy "orders: involved parties update"
  on public.orders for update
  using (
    auth.uid() = customer_id
    or auth.uid() = rider_id
    or exists (
      select 1 from public.restaurants r
      where r.restaurant_id = orders.restaurant_id
        and r.vendor_id = auth.uid()
    )
  );

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (order_id) on delete cascade,
  menu_item_id uuid references public.menu_items (menu_item_id) on delete set null,
  quantity     integer not null check (quantity > 0),
  unit_price   numeric(10, 2) not null default 0,
  notes        text
);

create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

drop policy if exists "order_items: involved parties read" on public.order_items;
create policy "order_items: involved parties read"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.order_id = order_items.order_id
        and (
          auth.uid() = o.customer_id
          or auth.uid() = o.rider_id
          or exists (
            select 1 from public.restaurants r
            where r.restaurant_id = o.restaurant_id
              and r.vendor_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "order_items: customer insert" on public.order_items;
create policy "order_items: customer insert"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.order_id = order_items.order_id
        and auth.uid() = o.customer_id
    )
  );


-- ----------------------------------------------------------------------------
-- 8. courier_orders — package delivery
-- ----------------------------------------------------------------------------
create table if not exists public.courier_orders (
  courier_order_id     uuid        primary key default gen_random_uuid(),
  customer_id          uuid        references public.customers (customer_id) on delete set null,
  rider_id             uuid        references public.riders (rider_id) on delete set null,

  pickup_address       text        not null,
  destination_address  text        not null,
  customer_lat         double precision,
  customer_lng         double precision,
  rider_lat            double precision,
  rider_lng            double precision,

  package_size         text        not null default 'Small'
                                    check (package_size in ('Small', 'Medium', 'Large')),
  delivery_fee         numeric(10, 2),
  rider_paid           boolean     not null default false,

  status               text        not null default 'Waiting for Rider'
                                    check (status in (
                                      'Waiting for Rider', 'Rider Assigned', 'Out for Delivery', 'Delivered'
                                    )),

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists courier_orders_customer_idx on public.courier_orders (customer_id);
create index if not exists courier_orders_rider_idx on public.courier_orders (rider_id);
create index if not exists courier_orders_offer_pool_idx on public.courier_orders (status, rider_id)
  where status = 'Waiting for Rider' and rider_id is null;

alter table public.courier_orders enable row level security;

drop policy if exists "courier_orders: involved parties read" on public.courier_orders;
create policy "courier_orders: involved parties read"
  on public.courier_orders for select
  using (auth.uid() = customer_id or auth.uid() = rider_id);

drop policy if exists "courier_orders: riders see pool" on public.courier_orders;
create policy "courier_orders: riders see pool"
  on public.courier_orders for select
  using (status = 'Waiting for Rider' and rider_id is null);

drop policy if exists "courier_orders: customer create" on public.courier_orders;
create policy "courier_orders: customer create"
  on public.courier_orders for insert
  with check (auth.uid() = customer_id);

drop policy if exists "courier_orders: involved parties update" on public.courier_orders;
create policy "courier_orders: involved parties update"
  on public.courier_orders for update
  using (auth.uid() = customer_id or auth.uid() = rider_id or rider_id is null);


-- ----------------------------------------------------------------------------
-- 9. user_settings — generic per-user key/value store (rider earnings, etc)
-- ----------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid not null references public.users (id) on delete cascade,
  key     text not null,
  value   text not null default '',
  primary key (user_id, key)
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings: owner all" on public.user_settings;
create policy "user_settings: owner all"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 10. Realtime — lets the app poll less and subscribe instead (optional but
--     matches the periodic-refresh patterns already in the UI)
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.courier_orders;
alter publication supabase_realtime add table public.menu_items;
alter publication supabase_realtime add table public.cart_items;


-- ============================================================================
--  DONE. Next steps:
--    1. Dashboard -> Authentication -> Sign In / Providers -> Email
--         * "Enable Email provider" = ON
--         * "Confirm email"         = OFF   (so signUp() logs the user in
--           immediately, matching Login.jsx's flow)
--    2. Copy Project Settings -> API -> Project URL + anon public key into
--       your local .env (see .env.example).
-- ============================================================================
