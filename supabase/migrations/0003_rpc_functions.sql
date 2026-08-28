-- ============================================================================
-- RPC functions — the state transitions that need to be atomic
-- ============================================================================
-- The localStorage version did read-modify-write in JS (fetch array, map,
-- setItem) and used `window.dispatchEvent` to tell other tabs. In Postgres:
--   * these functions do the check + write in one transaction, so two riders
--     can't both "win" the same delivery (utils/deliverypool.js:acceptDelivery
--     had a TOCTOU race — this closes it with `for update`)
--   * Supabase Realtime replaces the dispatchEvent broadcasts (see README)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- place_order — checkout. Replaces CartDrawer.jsx handlePlaceOrder.
-- Creates the order + its line items from the caller's cart, then empties
-- the cart. Returns the new order id.
-- ---------------------------------------------------------------------------
create or replace function place_order(
  p_customer_latitude  double precision default null,
  p_customer_longitude double precision default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_customer   profiles%rowtype;
  v_cart_id    uuid;
  v_vendor_id  uuid;
  v_total      numeric(10,2);
  v_order_id   uuid;
begin
  select * into v_customer from profiles where id = auth.uid();
  if v_customer.role <> 'customer' then
    raise exception 'Only customers can place orders';
  end if;

  select id into v_cart_id from carts where customer_id = auth.uid();
  if v_cart_id is null then
    raise exception 'Cart is empty';
  end if;

  -- single-vendor cart is guaranteed by the cart_items trigger
  select mi.vendor_id,
         sum((ci.unit_price
              + coalesce((select sum((a ->> 'price')::numeric)
                          from jsonb_array_elements(ci.add_ons) a), 0)
             ) * ci.quantity)
    into v_vendor_id, v_total
  from cart_items ci
  join menu_items mi on mi.id = ci.menu_item_id
  where ci.cart_id = v_cart_id
  group by mi.vendor_id;

  if v_vendor_id is null then
    raise exception 'Cart is empty';
  end if;

  insert into orders (
    customer_id, customer_name, customer_phone,
    vendor_id, pickup_address, total,
    customer_latitude, customer_longitude
  )
  select
    v_customer.id,
    coalesce(v_customer.full_name, 'Guest'),
    coalesce(v_customer.phone, 'N/A'),
    v_vendor_id,
    p.restaurant_address,
    v_total,
    p_customer_latitude,
    p_customer_longitude
  from profiles p
  where p.id = v_vendor_id
  returning id into v_order_id;

  insert into order_items (order_id, menu_item_id, name, unit_price, quantity, add_ons)
  select v_order_id, ci.menu_item_id, mi.name, ci.unit_price, ci.quantity, ci.add_ons
  from cart_items ci
  join menu_items mi on mi.id = ci.menu_item_id
  where ci.cart_id = v_cart_id;

  delete from cart_items where cart_id = v_cart_id;

  return v_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- vendor_set_order_ready — VendorOrders.jsx updateStatus('Ready', fee).
-- Marking Ready is what releases the order into the rider pool, so the
-- vendor sets rider_earnings here in the same call.
-- ---------------------------------------------------------------------------
create or replace function vendor_set_order_ready(
  p_order_id uuid,
  p_rider_fee numeric
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_rider_fee is null or p_rider_fee <= 0 then
    raise exception 'Delivery fee must be a positive number';
  end if;

  update orders
     set status = 'Ready',
         rider_earnings = p_rider_fee
   where id = p_order_id
     and vendor_id = auth.uid();

  if not found then
    raise exception 'Order not found or not yours';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- vendor_set_order_status — the non-Ready transitions
-- (Placed / Preparing / Cancelled).
-- ---------------------------------------------------------------------------
create or replace function vendor_set_order_status(
  p_order_id uuid,
  p_status   order_status
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_status = 'Ready' then
    raise exception 'Use vendor_set_order_ready to mark an order Ready';
  end if;

  update orders
     set status = p_status
   where id = p_order_id
     and vendor_id = auth.uid();

  if not found then
    raise exception 'Order not found or not yours';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- accept_food_delivery — utils/deliverypool.js acceptDelivery('food-...').
-- Atomic claim: `for update` locks the row so only one rider wins.
-- ---------------------------------------------------------------------------
create or replace function accept_food_delivery(p_order_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_rider profiles%rowtype;
  v_ok    boolean;
begin
  select * into v_rider from profiles where id = auth.uid();
  if v_rider.role <> 'rider' then
    raise exception 'Only riders can accept deliveries';
  end if;

  perform 1 from orders
   where id = p_order_id and status = 'Ready' and rider_id is null
   for update;

  if not found then
    return false;   -- already taken / not ready
  end if;

  update orders
     set rider_id = v_rider.id,
         rider_name = v_rider.full_name,
         delivery_status = 'Accepted by Rider'
   where id = p_order_id;

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- cancel_food_delivery — rider backs out before pickup; order returns to pool
-- ---------------------------------------------------------------------------
create or replace function cancel_food_delivery(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update orders
     set rider_id = null,
         rider_name = null,
         delivery_status = 'Waiting for restaurant to confirm order'
   where id = p_order_id and rider_id = auth.uid();

  if not found then
    raise exception 'Delivery not found or not yours';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- set_food_delivery_status — Picked Up / Out for Delivery / Delivered
-- ---------------------------------------------------------------------------
create or replace function set_food_delivery_status(
  p_order_id uuid,
  p_status   food_delivery_status
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update orders
     set delivery_status = p_status
   where id = p_order_id and rider_id = auth.uid();

  if not found then
    raise exception 'Delivery not found or not yours';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- push_rider_location — deliverypool.js pushRiderLocationToBatch.
-- Writes the rider's GPS onto every active delivery (food + courier) they
-- hold, and auto-advances assigned courier jobs to 'Out for Delivery'.
-- ---------------------------------------------------------------------------
create or replace function push_rider_location(
  p_latitude  double precision,
  p_longitude double precision
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update orders
     set rider_latitude = p_latitude,
         rider_longitude = p_longitude
   where rider_id = auth.uid()
     and delivery_status <> 'Delivered';

  update courier_orders
     set rider_latitude = p_latitude,
         rider_longitude = p_longitude,
         status = case when status = 'Rider Assigned' then 'Out for Delivery' else status end
   where rider_id = auth.uid()
     and status <> 'Delivered';
end;
$$;

-- ---------------------------------------------------------------------------
-- accept_courier_delivery — RiderCourierOrders.jsx handleAcceptDelivery.
-- Rider sets their own fee on accept (unlike food orders).
-- ---------------------------------------------------------------------------
create or replace function accept_courier_delivery(
  p_courier_id uuid,
  p_fee        numeric
)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_rider profiles%rowtype;
begin
  select * into v_rider from profiles where id = auth.uid();
  if v_rider.role <> 'rider' then
    raise exception 'Only riders can accept deliveries';
  end if;
  if p_fee is null or p_fee <= 0 then
    raise exception 'Delivery fee must be a positive number';
  end if;

  perform 1 from courier_orders
   where id = p_courier_id and status = 'Waiting for Rider' and rider_id is null
   for update;

  if not found then
    return false;
  end if;

  update courier_orders
     set rider_id = v_rider.id,
         rider_name = v_rider.full_name,
         status = 'Rider Assigned',
         delivery_fee = p_fee,
         assigned_at = now()
   where id = p_courier_id;

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- set_courier_status — rider progresses a package job
-- ---------------------------------------------------------------------------
create or replace function set_courier_status(
  p_courier_id uuid,
  p_status     courier_status
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update courier_orders
     set status = p_status
   where id = p_courier_id and rider_id = auth.uid();

  if not found then
    raise exception 'Courier order not found or not yours';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- mark_delivery_paid / mark_courier_paid — RiderDashboard earnings tally.
-- Idempotent: returns the fee the first time, 0 after (so a re-render can't
-- double-count). Mirrors deliverypool.js markPaidIfNeeded.
-- ---------------------------------------------------------------------------
create or replace function mark_delivery_paid(p_order_id uuid)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_fee numeric;
begin
  update orders
     set rider_paid = true
   where id = p_order_id
     and rider_id = auth.uid()
     and rider_paid = false
  returning coalesce(rider_earnings, 0) into v_fee;

  return coalesce(v_fee, 0);
end;
$$;

create or replace function mark_courier_paid(p_courier_id uuid)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_fee numeric;
begin
  update courier_orders
     set rider_paid = true
   where id = p_courier_id
     and rider_id = auth.uid()
     and rider_paid = false
  returning coalesce(delivery_fee, 0) into v_fee;

  return coalesce(v_fee, 0);
end;
$$;
