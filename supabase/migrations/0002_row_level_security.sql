-- ============================================================================
-- Row Level Security
-- ============================================================================
-- With RLS on, the frontend can talk to the database directly (via the
-- anon/authenticated key) and Postgres itself enforces who may see or
-- change what. This replaces the ad-hoc `if (currentUser.role !== 'vendor')`
-- checks scattered through the components.
--
-- Helper: a SECURITY DEFINER function to read the caller's role without
-- tripping RLS recursion on `profiles`.
-- ============================================================================

create or replace function auth_role()
returns user_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
alter table profiles       enable row level security;
alter table categories     enable row level security;
alter table menu_items     enable row level security;
alter table carts          enable row level security;
alter table cart_items     enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;
alter table courier_orders enable row level security;

-- ===========================================================================
-- profiles
-- ===========================================================================
-- Anyone signed in can read profiles (needed to show restaurant name/address,
-- rider name, customer name across the app). Tighten later if you want to
-- expose only vendors publicly.
create policy "profiles are readable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- INSERT is done by the on_auth_user_created trigger (security definer),
-- so no INSERT policy is needed for normal signup.

-- ===========================================================================
-- categories  — vendor owns their own; everyone can read (menu browsing)
-- ===========================================================================
create policy "categories are readable by authenticated users"
  on categories for select
  to authenticated
  using (true);

create policy "vendors manage their own categories"
  on categories for all
  to authenticated
  using (vendor_id = auth.uid() and auth_role() = 'vendor')
  with check (vendor_id = auth.uid() and auth_role() = 'vendor');

-- ===========================================================================
-- menu_items  — public read (customers browse), vendor writes their own
-- ===========================================================================
create policy "menu items are readable by authenticated users"
  on menu_items for select
  to authenticated
  using (true);

create policy "vendors manage their own menu items"
  on menu_items for all
  to authenticated
  using (vendor_id = auth.uid() and auth_role() = 'vendor')
  with check (vendor_id = auth.uid() and auth_role() = 'vendor');

-- ===========================================================================
-- carts + cart_items  — strictly the owning customer
-- ===========================================================================
create policy "customers use their own cart"
  on carts for all
  to authenticated
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

create policy "customers use their own cart items"
  on cart_items for all
  to authenticated
  using (exists (
    select 1 from carts c
    where c.id = cart_items.cart_id and c.customer_id = auth.uid()
  ))
  with check (exists (
    select 1 from carts c
    where c.id = cart_items.cart_id and c.customer_id = auth.uid()
  ));

-- ===========================================================================
-- orders  (food)
-- ===========================================================================
-- Who can SEE an order:
--   * the customer who placed it
--   * the vendor it belongs to
--   * the rider assigned to it
--   * ANY rider, but only while it's an open offer (Ready + no rider) — this
--     is what powers the "available deliveries" pool in the rider dashboard
create policy "orders are visible to the parties involved"
  on orders for select
  to authenticated
  using (
    customer_id = auth.uid()
    or vendor_id = auth.uid()
    or rider_id  = auth.uid()
    or (auth_role() = 'rider' and status = 'Ready' and rider_id is null)
  );

-- Customers create their own orders
create policy "customers create their own orders"
  on orders for insert
  to authenticated
  with check (customer_id = auth.uid() and auth_role() = 'customer');

-- Vendors update the restaurant-side of their orders (status, rider_earnings).
-- Column-level rules (can't touch rider_id etc.) are better enforced with a
-- dedicated RPC; this policy just gates the row.
create policy "vendors update their own orders"
  on orders for update
  to authenticated
  using (vendor_id = auth.uid() and auth_role() = 'vendor')
  with check (vendor_id = auth.uid() and auth_role() = 'vendor');

-- Riders update an order when:
--   * claiming it: it's an open offer and they're setting rider_id to themselves
--   * progressing it: they're already the assigned rider
create policy "riders claim and progress orders"
  on orders for update
  to authenticated
  using (
    auth_role() = 'rider'
    and (
      (status = 'Ready' and rider_id is null)   -- claim
      or rider_id = auth.uid()                  -- progress / cancel
    )
  )
  with check (
    auth_role() = 'rider'
    and (rider_id = auth.uid() or rider_id is null)
  );

-- ===========================================================================
-- order_items  — visible / mutable iff the parent order is
-- ===========================================================================
create policy "order items follow their order (select)"
  on order_items for select
  to authenticated
  using (exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and (o.customer_id = auth.uid() or o.vendor_id = auth.uid() or o.rider_id = auth.uid())
  ));

create policy "customers add items to their own orders"
  on order_items for insert
  to authenticated
  with check (exists (
    select 1 from orders o
    where o.id = order_items.order_id and o.customer_id = auth.uid()
  ));

-- ===========================================================================
-- courier_orders  (package)
-- ===========================================================================
create policy "courier orders are visible to the parties involved"
  on courier_orders for select
  to authenticated
  using (
    customer_id = auth.uid()
    or rider_id = auth.uid()
    or (auth_role() = 'rider' and status = 'Waiting for Rider' and rider_id is null)
  );

create policy "customers create their own courier orders"
  on courier_orders for insert
  to authenticated
  with check (customer_id = auth.uid() and auth_role() = 'customer');

create policy "riders claim and progress courier orders"
  on courier_orders for update
  to authenticated
  using (
    auth_role() = 'rider'
    and (
      (status = 'Waiting for Rider' and rider_id is null)
      or rider_id = auth.uid()
    )
  )
  with check (
    auth_role() = 'rider'
    and (rider_id = auth.uid() or rider_id is null)
  );

-- customers may cancel their own courier order while it's still unassigned
create policy "customers cancel their own unassigned courier orders"
  on courier_orders for update
  to authenticated
  using (customer_id = auth.uid() and status = 'Waiting for Rider')
  with check (customer_id = auth.uid());
