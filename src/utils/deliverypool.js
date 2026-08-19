// Unified helpers so the rider dashboard can treat food orders and
// courier orders as ONE pool of "deliveries" for offers/batching,
// while still reading/writing them to their original localStorage keys
// ("orders" for food, "courierOrders" for packages).
//
// A "poolId" is how the dashboard refers to a delivery regardless of
// type: "food-<id>" or "courier-<id>". Every function below that takes
// a poolId parses it back into the original array + raw id internally.

const FOOD_KEY = "orders";
const COURIER_KEY = "courierOrders";

export const MAX_BATCH_SIZE = 5;
export const OFFER_WINDOW_SECONDS = 35;

function getFoodOrders() {
  return JSON.parse(localStorage.getItem(FOOD_KEY)) || [];
}
function setFoodOrders(orders) {
  localStorage.setItem(FOOD_KEY, JSON.stringify(orders));
}
function getCourierOrders() {
  return JSON.parse(localStorage.getItem(COURIER_KEY)) || [];
}
function setCourierOrders(orders) {
  localStorage.setItem(COURIER_KEY, JSON.stringify(orders));
}

function splitPoolId(poolId) {
  const idx = poolId.indexOf("-");
  return [poolId.slice(0, idx), poolId.slice(idx + 1)];
}

// --- Normalizers -----------------------------------------------------
// Turn a raw food/courier order into one shared shape the dashboard
// can render and reason about the same way.

function normalizeFood(order) {
  return {
    poolId: `food-${order.id}`,
    type: "food",
    rawId: order.id,
    title: order.restaurantName,
    pickupLabel: order.restaurantName,
    dropoffLabel: order.customerName,
    fee: order.riderEarnings,
    isAvailable: order.status === "Ready" && !order.riderId,
    mineFor: (riderId) => order.riderId === riderId,
    isDelivered: order.deliveryStatus === "Delivered",
    isPaid: !!order.riderPaid,
    workflowStatus: order.deliveryStatus,
    placedAt: order.placedAt,
    raw: order,
  };
}

function normalizeCourier(order) {
  return {
    poolId: `courier-${order.id}`,
    type: "courier",
    rawId: order.id,
    title: "Package Delivery",
    pickupLabel: order.pickupAddress,
    dropoffLabel: order.destinationAddress,
    fee: order.deliveryFee,
    isAvailable: order.status === "Waiting for Rider" && !order.riderId,
    mineFor: (riderId) => order.riderId === riderId,
    isDelivered: order.status === "Delivered",
    isPaid: !!order.riderPaid,
    workflowStatus: order.status,
    placedAt: order.createdAt,
    raw: order,
  };
}

export function getAllNormalized() {
  const food = getFoodOrders().map(normalizeFood);
  const courier = getCourierOrders().map(normalizeCourier);
  return [...food, ...courier];
}

// Deliveries anyone could still be offered (used by the popup poller).
export function getAvailableForOffers() {
  return getAllNormalized()
    .filter((d) => d.isAvailable)
    .sort((a, b) => (a.placedAt || 0) - (b.placedAt || 0));
}

// This rider's current active batch (accepted, not yet delivered).
export function getMyBatch(riderId) {
  return getAllNormalized().filter(
    (d) => d.mineFor(riderId) && !d.isDelivered
  );
}

// This rider's completed history.
export function getMyCompleted(riderId) {
  return getAllNormalized().filter(
    (d) => d.mineFor(riderId) && d.isDelivered
  );
}

// Try to lock a delivery to a rider. Returns true if this rider won it,
// false if it was already taken / no longer available (e.g. another
// rider/tab accepted it first, or the vendor cancelled it).
export function acceptDelivery(poolId, rider) {
  const [type, rawIdStr] = splitPoolId(poolId);
  const rawId = Number(rawIdStr);

  if (type === "food") {
    const orders = getFoodOrders();
    const target = orders.find((o) => o.id === rawId);
    if (!target || target.status !== "Ready" || target.riderId) {
      return false;
    }
    setFoodOrders(
      orders.map((o) =>
        o.id === rawId
          ? {
              ...o,
              riderId: rider.id,
              riderName: rider.fullName,
              deliveryStatus: "Accepted by Rider",
            }
          : o
      )
    );
    window.dispatchEvent(new Event("ordersUpdated"));
    return true;
  }

  if (type === "courier") {
    const orders = getCourierOrders();
    const target = orders.find((o) => o.id === rawId);
    if (!target || target.status !== "Waiting for Rider" || target.riderId) {
      return false;
    }
    setCourierOrders(
      orders.map((o) =>
        o.id === rawId
          ? {
              ...o,
              riderId: rider.id,
              riderName: rider.fullName,
              status: "Rider Assigned",
            }
          : o
      )
    );
    window.dispatchEvent(new Event("courierOrdersUpdated"));
    return true;
  }

  return false;
}

// Rider backs out before pickup — delivery returns to the pool for
// everyone else to see again.
export function cancelDelivery(poolId) {
  const [type, rawIdStr] = splitPoolId(poolId);
  const rawId = Number(rawIdStr);

  if (type === "food") {
    const orders = getFoodOrders();
    setFoodOrders(
      orders.map((o) =>
        o.id === rawId
          ? {
              ...o,
              riderId: null,
              riderName: null,
              deliveryStatus: "Waiting for restaurant to confirm order",
            }
          : o
      )
    );
    window.dispatchEvent(new Event("ordersUpdated"));
    return;
  }

  if (type === "courier") {
    const orders = getCourierOrders();
    setCourierOrders(
      orders.map((o) =>
        o.id === rawId
          ? {
              ...o,
              riderId: null,
              riderName: null,
              status: "Waiting for Rider",
              deliveryFee: null,
            }
          : o
      )
    );
    window.dispatchEvent(new Event("courierOrdersUpdated"));
    return;
  }
}

// Moves one delivery in the rider's batch to a new workflow status
// (Picked Up / Out for Delivery / Delivered, etc).
export function updateDeliveryStatus(poolId, newStatus) {
  const [type, rawIdStr] = splitPoolId(poolId);
  const rawId = Number(rawIdStr);

  if (type === "food") {
    const orders = getFoodOrders();
    const updated = orders.map((o) =>
      o.id === rawId ? { ...o, deliveryStatus: newStatus } : o
    );
    setFoodOrders(updated);
    window.dispatchEvent(new Event("ordersUpdated"));
    return updated.find((o) => o.id === rawId);
  }

  if (type === "courier") {
    const orders = getCourierOrders();
    const updated = orders.map((o) =>
      o.id === rawId ? { ...o, status: newStatus } : o
    );
    setCourierOrders(updated);
    window.dispatchEvent(new Event("courierOrdersUpdated"));
    return updated.find((o) => o.id === rawId);
  }
}

// Marks a delivery's fee as paid to the rider (so refreshes/re-renders
// don't double-count earnings). Returns the fee amount that was paid,
// or 0 if it was already paid / had no fee.
export function markPaidIfNeeded(poolId) {
  const [type, rawIdStr] = splitPoolId(poolId);
  const rawId = Number(rawIdStr);

  if (type === "food") {
    const orders = getFoodOrders();
    const target = orders.find((o) => o.id === rawId);
    if (!target || target.riderPaid) return 0;
    const fee = Number(target.riderEarnings) || 0;
    setFoodOrders(
      orders.map((o) => (o.id === rawId ? { ...o, riderPaid: true } : o))
    );
    window.dispatchEvent(new Event("ordersUpdated"));
    return fee;
  }

  if (type === "courier") {
    const orders = getCourierOrders();
    const target = orders.find((o) => o.id === rawId);
    if (!target || target.riderPaid) return 0;
    const fee = Number(target.deliveryFee) || 0;
    setCourierOrders(
      orders.map((o) => (o.id === rawId ? { ...o, riderPaid: true } : o))
    );
    window.dispatchEvent(new Event("courierOrdersUpdated"));
    return fee;
  }

  return 0;
}

// Writes the rider's live GPS position onto every active delivery in
// their current batch (both food and courier), and auto-advances
// courier deliveries to "Out for Delivery" once the rider is moving —
// matching the old RiderCourierDelivery.jsx behavior.
export function pushRiderLocationToBatch(riderId, latitude, longitude) {
  const foodOrders = getFoodOrders();
  let foodChanged = false;
  const updatedFood = foodOrders.map((o) => {
    if (o.riderId === riderId && o.deliveryStatus !== "Delivered") {
      foodChanged = true;
      return { ...o, riderLatitude: latitude, riderLongitude: longitude };
    }
    return o;
  });
  if (foodChanged) {
    setFoodOrders(updatedFood);
    window.dispatchEvent(new Event("ordersUpdated"));
  }

  const courierOrders = getCourierOrders();
  let courierChanged = false;
  const updatedCourier = courierOrders.map((o) => {
    if (o.riderId === riderId && o.status !== "Delivered") {
      courierChanged = true;
      return {
        ...o,
        riderLatitude: latitude,
        riderLongitude: longitude,
        status: o.status === "Rider Assigned" ? "Out for Delivery" : o.status,
      };
    }
    return o;
  });
  if (courierChanged) {
    setCourierOrders(updatedCourier);
    window.dispatchEvent(new Event("courierOrdersUpdated"));
  }
}