// Unified helpers so the rider dashboard can treat food orders and
// courier orders as ONE pool of "deliveries" for offers/batching,
// while using Supabase backend for data persistence.
//
// A "poolId" is how the dashboard refers to a delivery regardless of
// type: "food-<id>" or "courier-<id>". Every function below that takes
// a poolId parses it back into the original array + raw id (a string —
// see idGenerator.js) internally.

import { getOrders, updateOrder, getCourierOrders, updateCourierOrder } from './supabaseStorage.js';

export const MAX_BATCH_SIZE = 5;
export const OFFER_WINDOW_SECONDS = 35;

// poolIds look like "food-<id>" or "courier-<id>". Since generateId()
// produces ids that themselves contain a dash (e.g. "1737382920123-a8f3k2"),
// we only split on the FIRST dash — everything after it is the raw id,
// dashes and all.
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

export async function getAllNormalized() {
  try {
    const foodOrders = await getOrders();
    const courierOrders = await getCourierOrders();

    const food = (foodOrders || []).map(normalizeFood);
    const courier = (courierOrders || []).map(normalizeCourier);

    return [...food, ...courier];
  } catch (error) {
    console.error("Error fetching normalized deliveries:", error);
    return [];
  }
}

// Deliveries anyone could still be offered (used by the popup poller).
export async function getAvailableForOffers() {
  const all = await getAllNormalized();
  return all
    .filter((d) => d.isAvailable)
    .sort((a, b) => {
      const aDate = typeof a.placedAt === 'string' 
        ? new Date(a.placedAt).getTime() 
        : (a.placedAt || 0);
      const bDate = typeof b.placedAt === 'string' 
        ? new Date(b.placedAt).getTime() 
        : (b.placedAt || 0);
      return aDate - bDate;
    });
}

// This rider's current active batch (accepted, not yet delivered).
export async function getMyBatch(riderId) {
  const all = await getAllNormalized();
  return all.filter((d) => d.mineFor(riderId) && !d.isDelivered);
}

// This rider's completed history.
export async function getMyCompleted(riderId) {
  const all = await getAllNormalized();
  return all.filter((d) => d.mineFor(riderId) && d.isDelivered);
}

// Try to lock a delivery to a rider. Returns true if this rider won it,
// false if it was already taken / no longer available (e.g. another
// rider/tab accepted it first, or the vendor cancelled it).
export async function acceptDelivery(poolId, rider) {
  const [type, rawId] = splitPoolId(poolId);

  try {
    if (type === "food") {
      const orders = await getOrders();
      const target = orders.find((o) => o.id === rawId);
      if (!target || target.status !== "Ready" || target.riderId) {
        return false;
      }

      await updateOrder(rawId, {
        riderId: rider.id,
        riderName: rider.full_name,
        deliveryStatus: "Accepted by Rider",
      });

      return true;
    }

    if (type === "courier") {
      const orders = await getCourierOrders();
      const target = orders.find((o) => o.id === rawId);
      if (!target || target.status !== "Waiting for Rider" || target.riderId) {
        return false;
      }

      await updateCourierOrder(rawId, {
        riderId: rider.id,
        riderName: rider.full_name,
        status: "Rider Assigned",
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error accepting delivery:", error);
    return false;
  }
}

// Rider backs out before pickup — delivery returns to the pool for
// everyone else to see again.
export async function cancelDelivery(poolId) {
  const [type, rawId] = splitPoolId(poolId);

  try {
    if (type === "food") {
      await updateOrder(rawId, {
        riderId: null,
        riderName: null,
        deliveryStatus: "Waiting for restaurant to confirm order",
      });
      return;
    }

    if (type === "courier") {
      await updateCourierOrder(rawId, {
        riderId: null,
        riderName: null,
        status: "Waiting for Rider",
        deliveryFee: null,
      });
      return;
    }
  } catch (error) {
    console.error("Error cancelling delivery:", error);
  }
}

// Moves one delivery in the rider's batch to a new workflow status
// (Picked Up / Out for Delivery / Delivered, etc).
export async function updateDeliveryStatus(poolId, newStatus) {
  const [type, rawId] = splitPoolId(poolId);

  try {
    if (type === "food") {
      await updateOrder(rawId, {
        deliveryStatus: newStatus,
      });
      const orders = await getOrders();
      return orders.find((o) => o.id === rawId);
    }

    if (type === "courier") {
      await updateCourierOrder(rawId, {
        status: newStatus,
      });
      const orders = await getCourierOrders();
      return orders.find((o) => o.id === rawId);
    }
  } catch (error) {
    console.error("Error updating delivery status:", error);
  }
}

// Marks a delivery's fee as paid to the rider (so refreshes/re-renders
// don't double-count earnings). Returns the fee amount that was paid,
// or 0 if it was already paid / had no fee.
export async function markPaidIfNeeded(poolId) {
  const [type, rawId] = splitPoolId(poolId);

  try {
    if (type === "food") {
      const orders = await getOrders();
      const target = orders.find((o) => o.id === rawId);
      if (!target || target.riderPaid) return 0;
      const fee = Number(target.riderEarnings) || 0;
      
      await updateOrder(rawId, {
        riderPaid: true,
      });
      
      return fee;
    }

    if (type === "courier") {
      const orders = await getCourierOrders();
      const target = orders.find((o) => o.id === rawId);
      if (!target || target.riderPaid) return 0;
      const fee = Number(target.deliveryFee) || 0;
      
      await updateCourierOrder(rawId, {
        riderPaid: true,
      });
      
      return fee;
    }

    return 0;
  } catch (error) {
    console.error("Error marking delivery as paid:", error);
    return 0;
  }
}

// Writes the rider's live GPS position onto every active delivery in
// their current batch (both food and courier), and auto-advances
// courier deliveries to "Out for Delivery" once the rider is moving —
// matching the old RiderCourierDelivery.jsx behavior.
export async function pushRiderLocationToBatch(riderId, latitude, longitude) {
  try {
    const foodOrders = await getOrders();
    const activeFoodOrders = foodOrders.filter(
      (o) => o.riderId === riderId && o.deliveryStatus !== "Delivered"
    );

    for (const order of activeFoodOrders) {
      await updateOrder(order.id, {
        riderLatitude: latitude,
        riderLongitude: longitude,
      });
    }

    const courierOrders = await getCourierOrders();
    const activeCourierOrders = courierOrders.filter(
      (o) => o.riderId === riderId && o.status !== "Delivered"
    );

    for (const order of activeCourierOrders) {
      const newStatus = order.status === "Rider Assigned" ? "Out for Delivery" : order.status;
      await updateCourierOrder(order.id, {
        riderLatitude: latitude,
        riderLongitude: longitude,
        status: newStatus,
      });
    }
  } catch (error) {
    console.error("Error pushing rider location to batch:", error);
  }
}