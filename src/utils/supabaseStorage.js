import { supabase } from '../lib/supabase.js';

// ============================================================
// USER/PROFILE MANAGEMENT (unchanged — already matched the schema)
// ============================================================

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  return profile;
}

export async function getCurrentUserByRole(role) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .eq('role', role)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  return profile;
}

export async function saveUserProfile(userId, profileData) {
  const { error } = await supabase
    .from('users')
    .update(profileData)
    .eq('id', userId);

  if (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
}

export async function getVendorDetails(vendorId) {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('vendor_id', vendorId)
    .single();

  if (error) {
    console.error('Error fetching vendor details:', error);
    return null;
  }
  return data;
}

// Looks up the restaurant_id owned by a vendor — needed constantly
// below, since menu_items/orders key off restaurant_id, not vendor_id.
async function getRestaurantIdForVendor(vendorId) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('restaurant_id')
    .eq('vendor_id', vendorId)
    .single();

  if (error || !data) return null;
  return data.restaurant_id;
}

// Batches a lookup of users' full_name/phone for a list of ids, so
// order/courier-order queries below can attach display names without
// a separate round trip per row.
async function getUsersById(ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, phone')
    .in('id', uniqueIds);

  if (error) {
    console.error('Error fetching users for display names:', error);
    return new Map();
  }

  return new Map(data.map((u) => [u.id, u]));
}

// ============================================================
// MENUS & CATEGORIES
// ============================================================

export async function getMenus(vendorId) {
  const restaurantId = await getRestaurantIdForVendor(vendorId);
  if (!restaurantId) return [];

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId);

  if (error) {
    console.error('Error fetching menus:', error);
    return [];
  }

  // Shaped to match what MenuForm.jsx / MenuTable.jsx already expect.
  return (data || []).map((item) => ({
    id: item.menu_item_id,
    menu_item_id: item.menu_item_id,
    name: item.name,
    foodName: item.name,
    itemName: item.name,
    category: item.category,
    price: item.price,
    description: item.description,
    image: item.image_url,
    image_url: item.image_url,
  }));
}

// NOTE: deprecated. MenuForm.jsx and MenuTable.jsx already insert/
// update/delete menu items directly against Supabase per-action —
// that's the correct pattern. This whole-list "delete everything, then
// reinsert everything" approach is dangerous (it would orphan any
// order_items pointing at the deleted menu_item_ids) and is no longer
// called anywhere. Kept only so an old import doesn't crash the build.
export async function saveMenus() {
  console.warn(
    'saveMenus() is deprecated and does nothing — menu items are saved directly by MenuForm.jsx/MenuTable.jsx now.'
  );
}

export async function getCategories(vendorId) {
  const restaurantId = await getRestaurantIdForVendor(vendorId);
  if (!restaurantId) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .eq('restaurant_id', restaurantId);

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  // Menu.jsx works with a plain array of category name strings.
  return (data || []).map((c) => c.name);
}

// Adds a single category — targeted insert, not a bulk replace, so it
// can't corrupt the rest of the list.
export async function addCategory(vendorId, name) {
  const restaurantId = await getRestaurantIdForVendor(vendorId);
  if (!restaurantId) throw new Error('No restaurant found for this vendor.');

  const { error } = await supabase
    .from('categories')
    .insert({ restaurant_id: restaurantId, name });

  if (error) {
    console.error('Error adding category:', error);
    throw error;
  }
}

// Removes a single category by name.
export async function deleteCategoryByName(vendorId, name) {
  const restaurantId = await getRestaurantIdForVendor(vendorId);
  if (!restaurantId) throw new Error('No restaurant found for this vendor.');

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('restaurant_id', restaurantId)
    .eq('name', name);

  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

// NOTE: deprecated for the same reason as saveMenus — bulk-replacing
// categories from a plain string array was also the bug that spread
// string characters into columns (`...c` on a string, not an object).
// Use addCategory / deleteCategoryByName instead.
export async function saveCategories() {
  console.warn(
    'saveCategories() is deprecated and does nothing — use addCategory()/deleteCategoryByName() instead.'
  );
}

// ============================================================
// CART
// ============================================================

export async function getCart(customerId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('customer_id', customerId)
    .order('added_at', { ascending: true });

  if (error) {
    console.error('Error fetching cart:', error);
    return [];
  }

  return (data || []).map((row) => ({
    vendorId: row.vendor_id,
    restaurantName: row.restaurant_name,
    itemId: row.item_id,
    name: row.name,
    itemName: row.name,
    price: Number(row.price) || 0,
    quantity: row.quantity,
    addOns: row.add_ons || [],
    image: row.image,
    addedAt: row.added_at,
  }));
}

export async function saveCart(customerId, cartItems) {
  const { error: deleteError } = await supabase
    .from('cart_items')
    .delete()
    .eq('customer_id', customerId);

  if (deleteError) {
    console.error('Error clearing cart:', deleteError);
    throw deleteError;
  }

  if (!cartItems || cartItems.length === 0) return;

  const rows = cartItems.map((item) => ({
    customer_id: customerId,
    vendor_id: item.vendorId,
    restaurant_name: item.restaurantName,
    item_id: item.itemId != null ? String(item.itemId) : null,
    name: item.name || item.itemName,
    price: item.price,
    quantity: item.quantity,
    add_ons: item.addOns || [],
    image: item.image || null,
    added_at: item.addedAt || new Date().toISOString(),
  }));

  const { error: insertError } = await supabase
    .from('cart_items')
    .insert(rows);

  if (insertError) {
    console.error('Error saving cart:', insertError);
    throw insertError;
  }
}

export async function clearCart(customerId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('customer_id', customerId);

  if (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}

// ============================================================
// ORDERS (FOOD DELIVERY)
// ============================================================

// Translates the camelCase fields the rest of the app already sends
// into the real snake_case columns on `orders`. Keys with no matching
// column (riderName, restaurantName, customerName — all derived via
// joins in getOrders instead) are simply dropped.
const ORDER_FIELD_MAP = {
  status: 'status',
  riderId: 'rider_id',
  deliveryStatus: 'delivery_status',
  riderLatitude: 'rider_latitude',
  riderLongitude: 'rider_longitude',
  riderEarnings: 'delivery_fee',
  riderPaid: 'rider_paid',
  customerLatitude: 'customer_lat',
  customerLongitude: 'customer_lng',
  deliveryAddress: 'delivery_address',
};

function mapOrderUpdates(updates) {
  const mapped = {};
  for (const [key, value] of Object.entries(updates)) {
    const column = ORDER_FIELD_MAP[key];
    if (column) mapped[column] = value;
  }
  return mapped;
}

// Turns a raw `orders` row (plus attached lookups) into the flat
// camelCase shape every page in the app already expects.
function shapeOrder(row, restaurantsById, usersById, itemsByOrderId) {
  const restaurant = restaurantsById.get(row.restaurant_id);
  const customer = usersById.get(row.customer_id);
  const rider = row.rider_id ? usersById.get(row.rider_id) : null;

  return {
    id: row.order_id,
    vendorId: restaurant?.vendor_id,
    restaurantName: restaurant?.name,
    pickupAddress: restaurant?.address_line,

    customerId: row.customer_id,
    customerName: customer?.full_name || 'Guest',
    customerphone: customer?.phone || 'N/A',

    riderId: row.rider_id,
    riderName: rider?.full_name || null,

    items: itemsByOrderId.get(row.order_id) || [],

    subtotal: Number(row.subtotal) || 0,
    total: Number(row.total_price) || 0,
    riderEarnings: row.delivery_fee != null ? Number(row.delivery_fee) : null,
    riderPaid: !!row.rider_paid,

    status: row.status,
    deliveryStatus: row.delivery_status,

    placedAt: row.placed_at,
    updatedAt: row.updated_at,

    customerLatitude: row.customer_lat,
    customerLongitude: row.customer_lng,
    riderLatitude: row.rider_latitude,
    riderLongitude: row.rider_longitude,

    deliveryAddress: row.delivery_address,
  };
}

export async function getOrders(filter = {}) {
  let query = supabase.from('orders').select('*');

  if (filter.customerId) {
    query = query.eq('customer_id', filter.customerId);
  }
  if (filter.riderId) {
    query = query.eq('rider_id', filter.riderId);
  }
  if (filter.vendorId) {
    const restaurantId = await getRestaurantIdForVendor(filter.vendorId);
    if (!restaurantId) return [];
    query = query.eq('restaurant_id', restaurantId);
  }

  const { data: orders, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  if (!orders || orders.length === 0) return [];

  // Batch-fetch everything needed to fill in display fields.
  const restaurantIds = [...new Set(orders.map((o) => o.restaurant_id).filter(Boolean))];
  const userIds = [
    ...orders.map((o) => o.customer_id),
    ...orders.map((o) => o.rider_id),
  ];
  const orderIds = orders.map((o) => o.order_id);

  const [{ data: restaurants }, usersById, { data: orderItems }] = await Promise.all([
    restaurantIds.length
      ? supabase.from('restaurants').select('restaurant_id, name, address_line, vendor_id').in('restaurant_id', restaurantIds)
      : Promise.resolve({ data: [] }),
    getUsersById(userIds),
    orderIds.length
      ? supabase
          .from('order_items')
          .select('order_id, quantity, unit_price, notes, menu_items ( name )')
          .in('order_id', orderIds)
      : Promise.resolve({ data: [] }),
  ]);

  const restaurantsById = new Map((restaurants || []).map((r) => [r.restaurant_id, r]));

  const itemsByOrderId = new Map();
  for (const item of orderItems || []) {
    const list = itemsByOrderId.get(item.order_id) || [];
    list.push({
      name: item.menu_items?.name || 'Item',
      price: Number(item.unit_price) || 0,
      quantity: item.quantity,
      notes: item.notes,
    });
    itemsByOrderId.set(item.order_id, list);
  }

  return orders.map((row) => shapeOrder(row, restaurantsById, usersById, itemsByOrderId));
}

// Creates an order plus its order_items rows. `orderData` arrives in
// the camelCase shape CartDrawer.jsx already builds.
export async function createOrder(orderData) {
  const restaurantId = await getRestaurantIdForVendor(orderData.vendorId);
  if (!restaurantId) {
    throw new Error('Could not find a restaurant for this order.');
  }

  const { data: inserted, error: insertError } = await supabase
    .from('orders')
    .insert({
      customer_id: orderData.customerId,
      restaurant_id: restaurantId,
      rider_id: orderData.riderId || null,
      status: orderData.status || 'Placed',
      delivery_status: orderData.deliveryStatus || null,
      delivery_address: orderData.deliveryAddress || null,
      customer_lat: orderData.customerLatitude ?? null,
      customer_lng: orderData.customerLongitude ?? null,
      subtotal: orderData.subtotal ?? orderData.total,
      delivery_fee: orderData.riderEarnings ?? 0,
      total_price: orderData.total,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating order:', insertError);
    throw insertError;
  }

  // Insert line items. Skips any cart item whose itemId isn't a real
  // UUID (e.g. mock/sample data like "mock-1-a") rather than either
  // crashing the whole order or, worse, silently attaching a line item
  // to the wrong menu_item_id if a fake id happened to collide.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const items = orderData.items || [];
  if (items.length > 0) {
    const skipped = items.filter((item) => !UUID_RE.test(String(item.itemId)));
    if (skipped.length > 0) {
      console.warn(
        `Skipped ${skipped.length} cart item(s) with non-UUID itemId (likely mock data):`,
        skipped.map((i) => i.itemId)
      );
    }

    const rows = items
      .filter((item) => UUID_RE.test(String(item.itemId)))
      .map((item) => ({
        order_id: inserted.order_id,
        menu_item_id: item.itemId,
        quantity: item.quantity,
        unit_price: item.price,
      }));

    if (rows.length > 0) {
      const { error: itemsError } = await supabase.from('order_items').insert(rows);
      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Don't throw — the order itself was created successfully;
        // losing line-item detail is recoverable, losing the order isn't.
      }
    }
  }

  return inserted;
}

export async function updateOrder(orderId, updates) {
  const mapped = mapOrderUpdates(updates);
  if (Object.keys(mapped).length === 0) return;

  const { error } = await supabase
    .from('orders')
    .update(mapped)
    .eq('order_id', orderId);

  if (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

// ============================================================
// COURIER ORDERS (PACKAGE DELIVERY)
// ============================================================

const COURIER_FIELD_MAP = {
  riderId: 'rider_id',
  status: 'status',
  deliveryFee: 'delivery_fee',
  riderLatitude: 'rider_lat',
  riderLongitude: 'rider_lng',
  riderPaid: 'rider_paid',
};

function mapCourierUpdates(updates) {
  const mapped = {};
  for (const [key, value] of Object.entries(updates)) {
    const column = COURIER_FIELD_MAP[key];
    if (column) mapped[column] = value;
  }
  return mapped;
}

function shapeCourierOrder(row, usersById) {
  const customer = usersById.get(row.customer_id);
  const rider = row.rider_id ? usersById.get(row.rider_id) : null;

  return {
    id: row.courier_order_id,

    customerId: row.customer_id,
    customerName: customer?.full_name || 'Guest',
    customerPhone: customer?.phone || 'N/A',

    riderId: row.rider_id,
    riderName: rider?.full_name || null,

    pickupAddress: row.pickup_address,
    destinationAddress: row.destination_address,

    customerLatitude: row.customer_lat,
    customerLongitude: row.customer_lng,
    riderLatitude: row.rider_lat,
    riderLongitude: row.rider_lng,

    packageSize: row.package_size,
    deliveryFee: row.delivery_fee != null ? Number(row.delivery_fee) : null,
    riderPaid: !!row.rider_paid,

    status: row.status,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCourierOrders(filter = {}) {
  let query = supabase.from('courier_orders').select('*');

  if (filter.customerId) {
    query = query.eq('customer_id', filter.customerId);
  }
  if (filter.riderId) {
    query = query.eq('rider_id', filter.riderId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching courier orders:', error);
    return [];
  }
  if (!data || data.length === 0) return [];

  const userIds = [...data.map((o) => o.customer_id), ...data.map((o) => o.rider_id)];
  const usersById = await getUsersById(userIds);

  return data.map((row) => shapeCourierOrder(row, usersById));
}

export async function createCourierOrder(orderData) {
  const { data, error } = await supabase
    .from('courier_orders')
    .insert({
      customer_id: orderData.customerId,
      pickup_address: orderData.pickupAddress,
      destination_address: orderData.destinationAddress,
      customer_lat: orderData.customerLatitude ?? null,
      customer_lng: orderData.customerLongitude ?? null,
      package_size: orderData.packageSize || 'Small',
      status: orderData.status || 'Waiting for Rider',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating courier order:', error);
    throw error;
  }
  return data;
}

export async function updateCourierOrder(orderId, updates) {
  const mapped = mapCourierUpdates(updates);
  if (Object.keys(mapped).length === 0) return;

  const { error } = await supabase
    .from('courier_orders')
    .update(mapped)
    .eq('courier_order_id', orderId);

  if (error) {
    console.error('Error updating courier order:', error);
    throw error;
  }
}

// ============================================================
// GENERIC JSON STORAGE (for settings, flags, etc) — unchanged
// ============================================================

export async function getStoredData(key, defaultValue = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return defaultValue;

    const { data, error } = await supabase
      .from('user_settings')
      .select('value')
      .eq('user_id', user.id)
      .eq('key', key)
      .single();

    if (error || !data) return defaultValue;

    return JSON.parse(data.value);
  } catch (err) {
    console.error(`Error getting stored data for key "${key}":`, err);
    return defaultValue;
  }
}

export async function saveStoredData(key, value) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      key,
      value: JSON.stringify(value),
    }, { onConflict: 'user_id,key' });

  if (error) {
    console.error(`Error saving stored data for key "${key}":`, error);
    throw error;
  }
}

export async function getStoredArray(key) {
  const data = await getStoredData(key, []);
  return Array.isArray(data) ? data : [];
}

export async function setStoredArray(key, array) {
  await saveStoredData(key, array);
}

export const CURRENT_USER_KEYS = {
  vendor: 'vendorCurrentUser',
  rider: 'riderCurrentUser',
  customer: 'customerCurrentUser',
};