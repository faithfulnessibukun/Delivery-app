# Supabase backend for NewAge

This folder holds the Postgres schema that replaces the app's `localStorage`
backend. Nothing here is wired into the React app yet — these are the
migrations plus notes on how the pieces map.

## Files

| File | What it does |
|---|---|
| `migrations/0001_initial_schema.sql` | Tables, enums, FKs, `updated_at` triggers, the signup→profile trigger |
| `migrations/0002_row_level_security.sql` | RLS policies — who can read/write each row |
| `migrations/0003_rpc_functions.sql` | Atomic state transitions (checkout, accept delivery, status changes, GPS, payouts) |

## Applying it

```bash
npm i -g supabase                 # if you don't have the CLI
supabase init                     # once, creates supabase/config.toml
supabase link --project-ref <ref> # from your project's dashboard URL
supabase db push                  # runs the migrations against your project
```

Local dev DB instead:

```bash
supabase start                    # spins up local Postgres + Studio in Docker
supabase db reset                 # applies all migrations to the local DB
```

## How the old data model maps

The old README documented these `localStorage` keys. Here's where each one goes:

| localStorage key | Now |
|---|---|
| `users` (+ `vendorCurrentUser` / `riderCurrentUser` / `customerCurrentUser`) | `auth.users` (login + password, managed by Supabase Auth) + **`profiles`** (name, phone, role, restaurant info). `profiles.id` **is** `auth.users.id`. |
| `currentUser` / the three `*CurrentUser` keys | `supabase.auth.getUser()` — the session. See the multi-role note below. |
| `categories` (one global `string[]`) | **`categories`** table, now scoped per vendor (`unique (vendor_id, name)`). |
| `menus` | **`menu_items`**. The duplicated `restaurantName` / `restaurantAddress` / `vendorName` on every item are gone — they're a join to `profiles` via `vendor_id`. |
| `cart` (flat line-item array) | **`carts`** (one per customer) + **`cart_items`**. `add_ons` stays `jsonb` because add-ons aren't a table (see `src/data/addOns.js` — hardcoded list). |
| `orders` (food) | **`orders`** (header: customer/vendor/rider/money/status/GPS) + **`order_items`** (lines). The two status strings become `status` (`order_status` enum, vendor-side) and `delivery_status` (`food_delivery_status` enum, rider-side). |
| `courierOrders` (packages) | **`courier_orders`**. No line items — one package, one pickup, one drop-off, one `status` (`courier_status` enum) covering the whole lifecycle. |
| `useMockData` | Stays client-side. It's a demo toggle, not data. |

## The foreign keys, and why each `ON DELETE` is what it is

```
auth.users (Supabase Auth — owns email + password)
    │  id
    ▼  1─1
profiles ─────────────────────────────────────────────────────────┐
    │ id (PK, = auth.users.id)   ON DELETE CASCADE                 │
    │ role: customer | vendor | rider                             │
    │ restaurant_name / restaurant_address  (vendor only, CHECK)  │
    │                                                             │
    ├──< categories.vendor_id            ON DELETE CASCADE   ──────┤  vendor's own list;
    │                                                             │  delete vendor → drop their categories
    │                                                             │
    ├──< menu_items.vendor_id            ON DELETE CASCADE   ──────┤  same
    │                                                             │
    ├──1 carts.customer_id               ON DELETE CASCADE   ──────┤  cart is worthless without its owner
    │                                                             │
    ├──< orders.customer_id              ON DELETE SET NULL  ──────┤  keep the order for the vendor/rider
    │                                                             │  record; customer_name is snapshotted
    ├──< orders.vendor_id                ON DELETE RESTRICT  ──────┤  can't delete a restaurant that has
    │                                                             │  orders — close it out first
    ├──< orders.rider_id                 ON DELETE SET NULL  ──────┤  order survives a rider leaving
    │                                                             │
    ├──< courier_orders.customer_id      ON DELETE SET NULL  ──────┤  same reasoning as orders
    ├──< courier_orders.rider_id         ON DELETE SET NULL  ──────┘
    │
carts
    │ id
    └──< cart_items.cart_id              ON DELETE CASCADE          empty the cart with the cart

menu_items
    │ id
    ├──< cart_items.menu_item_id         ON DELETE CASCADE          item pulled → drop it from carts
    └──< order_items.menu_item_id        ON DELETE SET NULL         order line keeps name + price
                                                                   snapshot, just loses the live link
orders
    │ id
    └──< order_items.order_id            ON DELETE CASCADE          lines belong to their order
```

Rules of thumb used above:

- **CASCADE** when the child has no meaning without the parent (cart items,
  a vendor's menu, a user's profile).
- **SET NULL** when the row is a historical record that must outlive the
  person — orders keep `customer_name` / `rider_name` as plain text
  snapshots exactly so the row still reads correctly after the FK goes null.
- **RESTRICT** on `orders.vendor_id` so you can't accidentally wipe a
  restaurant that still has live orders attached.

### Snapshot columns (denormalised on purpose)

`orders.customer_name`, `orders.customer_phone`, `orders.rider_name`,
`order_items.name`, `order_items.unit_price`, `cart_items.unit_price`,
`courier_orders.customer_name/phone/rider_name` — these copy a value that
also lives behind a FK. That's deliberate: an order must show the price
that was charged and the name on the receipt, even after the menu item is
re-priced or the account is deleted. The FK is the live link; the snapshot
is the receipt.

## The offer pool (rider dashboard)

`src/utils/deliverypool.js` treats food orders and courier orders as one
pool of "available deliveries". That's reproduced by two partial indexes
and two RLS clauses:

- `orders_offer_pool_idx` — `where status = 'Ready' and rider_id is null`
- `courier_orders_offer_pool_idx` — `where status = 'Waiting for Rider' and rider_id is null`
- RLS lets any `rider` **select** rows matching those predicates, so the
  dashboard can query the pool directly.

`acceptDelivery()` in the old code had a race (two riders read the array,
both write themselves in). The RPCs `accept_food_delivery()` /
`accept_courier_delivery()` use `SELECT ... FOR UPDATE` so exactly one
rider wins; the loser gets `false` back, same contract as before.

## Realtime replaces `window.dispatchEvent`

The app currently pokes other tabs with
`window.dispatchEvent(new Event("ordersUpdated"))`. With Supabase you
subscribe instead:

```js
supabase
  .channel('orders')
  .on('postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      () => reloadOrders())
  .subscribe();
```

Enable Realtime for `orders`, `courier_orders`, `menu_items`, and
`cart_items` in the dashboard (Database → Replication) or via
`alter publication supabase_realtime add table orders;`.

## Multi-role accounts — decision needed

The current app lets **one person be a customer, a vendor, and a rider at
the same time** (three separate `*CurrentUser` localStorage keys). This
schema gives each login **one** `role`. Two ways forward, spelled out at
the bottom of `0001_initial_schema.sql`:

1. `user_roles (user_id, role)` join table — one login, many roles. More
   code (every policy changes).
2. One role per account; a person who's both a vendor and a rider makes
   two accounts. This is how DoorDash / Uber Eats actually work.

Nothing else in the schema depends on which you pick — `role` is only read
by the RLS policies and the `auth_role()` helper.

## What's NOT modelled yet (future tables)

- **Per-item add-ons** — `src/data/addOns.js` is a hardcoded generic list.
  When vendors define their own, add `menu_item_add_ons (id, menu_item_id,
  name, price)` and change `cart_items.add_ons` / `order_items.add_ons`
  from `jsonb` to a child table.
- **Payments** — there's no payment step in the app today. A `payments`
  table would hang off `orders.id` / `courier_orders.id`.
- **Rider batches** — `MAX_BATCH_SIZE` batching lives entirely in the
  dashboard's memory. If you want it server-side, a `delivery_batches`
  table with `orders.batch_id` / `courier_orders.batch_id`.
- **Ratings, addresses book, promo codes** — none exist yet.
