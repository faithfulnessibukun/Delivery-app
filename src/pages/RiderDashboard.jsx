import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMotorcycle,
  FaMapMarkerAlt,
  FaBoxOpen,
  FaMoneyBillWave,
  FaWallet,
  FaLayerGroup,
} from "react-icons/fa";
import toast from "react-hot-toast";
import LiveDeliveryMap from "../components/LiveDeliveryMap";
import DeliveryOfferPopup from "../components/DeliveryOfferPopup";
import { CURRENT_USER_KEYS } from "../utils/storage";
import {
  MAX_BATCH_SIZE,
  getAvailableForOffers,
  getMyBatch,
  getMyCompleted,
  acceptDelivery,
  cancelDelivery,
  updateDeliveryStatus,
  markPaidIfNeeded,
  pushRiderLocationToBatch,
} from "../utils/deliveryPool";

// How long (ms) an offer this rider ignored/let expire stays hidden
// from them before it's eligible to be shown again.
const DISMISS_COOLDOWN_MS = 45000;

// Workflow stages shown per delivery type. Food has a 4-step flow;
// courier is simpler (assigned -> out for delivery -> delivered), with
// "Out for Delivery" set automatically once the rider's GPS starts moving.
const FOOD_STEPS = ["Accepted by Rider", "Picked Up", "Out for Delivery", "Delivered"];
const FOOD_STEP_LABELS = ["Accepted", "Pickup", "On the Way", "Delivered"];

function RiderDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem(CURRENT_USER_KEYS.rider);
    toast.success("Logged out successfully!");
    navigate("/");
  };

  const [rider, setRider] = useState(null);
  const [myBatch, setMyBatch] = useState([]);
  const [myCompleted, setMyCompleted] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [currentOffer, setCurrentOffer] = useState(null);

  const dismissedRef = useRef(new Map()); // poolId -> dismissedAt timestamp
  const currentOfferRef = useRef(null);
  currentOfferRef.current = currentOffer;

  // --- Auth + initial load --------------------------------------------
  useEffect(() => {
    const currentUser =
      JSON.parse(localStorage.getItem(CURRENT_USER_KEYS.rider)) || null;

    if (!currentUser || currentUser.role !== "rider") {
      toast.error("Please login as a rider.");
      navigate("/");
      return;
    }

    setRider(currentUser);

    const savedEarnings =
      Number(localStorage.getItem(`riderEarnings_${currentUser.id}`)) || 0;
    setEarnings(savedEarnings);
  }, [navigate]);

  // --- Keep batch + completed lists in sync with both order stores ----
  const refreshLists = useCallback(() => {
    if (!rider) return;
    setMyBatch(getMyBatch(rider.id));
    setMyCompleted(getMyCompleted(rider.id));
  }, [rider]);

  useEffect(() => {
    if (!rider) return;
    refreshLists();

    window.addEventListener("ordersUpdated", refreshLists);
    window.addEventListener("courierOrdersUpdated", refreshLists);
    return () => {
      window.removeEventListener("ordersUpdated", refreshLists);
      window.removeEventListener("courierOrdersUpdated", refreshLists);
    };
  }, [rider, refreshLists]);

  // --- Pay the rider once a delivery reaches "Delivered" ---------------
  useEffect(() => {
    if (!rider) return;
    myBatch
      .filter((d) => d.isDelivered)
      .forEach((d) => {
        const fee = markPaidIfNeeded(d.poolId);
        if (fee > 0) {
          setEarnings((prev) => {
            const next = prev + fee;
            localStorage.setItem(`riderEarnings_${rider.id}`, next.toString());
            return next;
          });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myBatch, rider]);

  // --- Offer polling: only when batch has room and nothing is showing --
  useEffect(() => {
    if (!rider) return;

    const poll = () => {
      if (currentOfferRef.current) return; // already showing one
      if (myBatch.length >= MAX_BATCH_SIZE) return; // batch locked

      const now = Date.now();
      const available = getAvailableForOffers().filter((d) => {
        const dismissedAt = dismissedRef.current.get(d.poolId);
        return !dismissedAt || now - dismissedAt > DISMISS_COOLDOWN_MS;
      });

      if (available.length > 0) {
        setCurrentOffer(available[0]);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    window.addEventListener("ordersUpdated", poll);
    window.addEventListener("courierOrdersUpdated", poll);

    return () => {
      clearInterval(interval);
      window.removeEventListener("ordersUpdated", poll);
      window.removeEventListener("courierOrdersUpdated", poll);
    };
  }, [rider, myBatch.length]);

  const handleAcceptOffer = (offer) => {
    const won = acceptDelivery(offer.poolId, rider);
    setCurrentOffer(null);

    if (!won) {
      toast.error("Too slow — another rider already took that one.");
      return;
    }

    toast.success("Delivery accepted!");
    refreshLists();
  };

  const handleIgnoreOffer = (offer, { expired }) => {
    dismissedRef.current.set(offer.poolId, Date.now());
    setCurrentOffer(null);
    if (expired) {
      // Offer just times out for THIS rider — it's still available to
      // everyone else, so no toast needed, it just quietly disappears.
    }
  };

  const handleCancelPickup = (poolId) => {
    cancelDelivery(poolId);
    toast("Delivery returned to the pool.", { icon: "↩️" });
    refreshLists();
  };

  const handleAdvanceFood = (poolId, nextStatus) => {
    updateDeliveryStatus(poolId, nextStatus);
    refreshLists();
    if (nextStatus === "Picked Up") toast.success("Food picked up!");
    if (nextStatus === "Out for Delivery")
      toast.success("You're on the way to the customer!");
    if (nextStatus === "Delivered") toast.success("Order delivered successfully!");
  };

  const handleAdvanceCourier = (poolId, nextStatus) => {
    updateDeliveryStatus(poolId, nextStatus);
    refreshLists();
    if (nextStatus === "Delivered") toast.success("Package delivered successfully!");
  };

  // --- Rider live location: GPS watch + push onto every active delivery
  useEffect(() => {
    if (!rider) return;

    if (!navigator.geolocation) {
      toast.error("Your browser does not support location.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        localStorage.setItem(
          `riderLocation_${rider.id}`,
          JSON.stringify({ latitude, longitude, updatedAt: Date.now() })
        );
        window.dispatchEvent(new Event("riderLocationUpdated"));

        pushRiderLocationToBatch(rider.id, latitude, longitude);
      },
      () => {
        toast.error("Please allow location access for live delivery tracking.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [rider]);

  if (!rider) return null;

  const batchCount = myBatch.length;
  const batchLocked = batchCount >= MAX_BATCH_SIZE;
  const deliveredInBatch = myBatch.filter((d) => d.isDelivered).length;
  const mapTarget = myBatch.find(
    (d) => d.type === "food" && d.raw.customerLatitude && d.raw.customerLongitude
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Offer popup */}
      <DeliveryOfferPopup
        offer={currentOffer}
        onAccept={handleAcceptOffer}
        onIgnore={handleIgnoreOffer}
      />

      {/* Header */}
      <div className="bg-[#1F1B16] text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#F4B740] text-[#1F1B16] p-3 rounded-xl">
              <FaMotorcycle size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black">Rider Dashboard</h1>
              <p className="text-[#C9C2B4] text-sm">Welcome, {rider.fullName}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl font-bold transition"
          >
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <main className="min-h-screen w-auto p-4 pt-6 md:p-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Earnings</p>
              <h2 className="text-3xl font-black text-[#1F1B16] mt-2">
                ₦{earnings.toLocaleString()}
              </h2>
            </div>
            <div className="bg-[#E3EAE6] text-[#3B6255] p-4 rounded-xl">
              <FaWallet size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Completed Deliveries</p>
              <h2 className="text-3xl font-black text-[#1F1B16] mt-2">
                {myCompleted.length}
              </h2>
            </div>
            <div className="bg-[#FCF0D6] text-[#9C7311] p-4 rounded-xl">
              <FaBoxOpen size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Current Batch</p>
              <h2 className="text-3xl font-black text-[#1F1B16] mt-2">
                {batchCount} / {MAX_BATCH_SIZE}
              </h2>
            </div>
            <div className="bg-[#FCE7DD] text-[#E8491D] p-4 rounded-xl">
              <FaLayerGroup size={22} />
            </div>
          </div>
        </div>

        {/* Active Batch */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-[#1F1B16]">Active Batch</h2>
              <p className="text-gray-500 mt-1">
                {batchCount === 0
                  ? "You'll get an offer as soon as one is available."
                  : `${deliveredInBatch} / ${batchCount} completed in this batch.`}
              </p>
            </div>
          </div>

          {batchCount > 0 && (
            <div className="bg-white rounded-2xl shadow p-4 mb-5">
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#3B6255] h-3 rounded-full transition-all"
                  style={{
                    width: `${(deliveredInBatch / MAX_BATCH_SIZE) * 100}%`,
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {batchLocked
                  ? "New delivery offers are locked until this batch is completed."
                  : `${MAX_BATCH_SIZE - batchCount} slot${
                      MAX_BATCH_SIZE - batchCount === 1 ? "" : "s"
                    } left in this batch.`}
              </p>
            </div>
          )}

          {/* Batch map (food deliveries with GPS coords) */}
          {mapTarget && (
            <div className="bg-white rounded-2xl shadow overflow-hidden mb-5">
              <LiveDeliveryMap
                customerLatitude={mapTarget.raw.customerLatitude}
                customerLongitude={mapTarget.raw.customerLongitude}
                riderLatitude={mapTarget.raw.riderLatitude}
                riderLongitude={mapTarget.raw.riderLongitude}
              />
            </div>
          )}

          {batchCount === 0 ? (
            <div className="bg-white rounded-2xl shadow p-10 text-center">
              <FaBoxOpen className="mx-auto text-gray-300 mb-4" size={40} />
              <h3 className="text-lg font-bold">No active deliveries</h3>
              <p className="text-gray-500 mt-2">
                New offers will pop up here as soon as one becomes available.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myBatch.map((d) =>
                d.type === "food" ? (
                  <FoodBatchCard
                    key={d.poolId}
                    delivery={d}
                    onCancel={handleCancelPickup}
                    onAdvance={handleAdvanceFood}
                  />
                ) : (
                  <CourierBatchCard
                    key={d.poolId}
                    delivery={d}
                    onCancel={handleCancelPickup}
                    onAdvance={handleAdvanceCourier}
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* Earnings History */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black text-[#1F1B16]">Earnings History</h2>
              <p className="text-gray-500 mt-1">
                Money earned from completed deliveries.
              </p>
            </div>
            <div className="bg-[#E3EAE6] text-[#3B6255] px-4 py-2 rounded-full font-bold">
              ₦{earnings.toLocaleString()}
            </div>
          </div>

          {myCompleted.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center">
              <FaMoneyBillWave className="mx-auto text-gray-300 mb-4" size={35} />
              <h3 className="text-lg font-bold">No Earnings Yet</h3>
              <p className="text-gray-500 mt-2">Complete a delivery to start earning.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              {myCompleted.map((d) => (
                <div
                  key={d.poolId}
                  className="flex items-center justify-between gap-4 p-5 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-bold text-[#1F1B16]">{d.title}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {d.type === "food" ? "Food delivery" : "Courier delivery"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-black text-lg">
                      +₦{Number(d.fee || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Delivery fee</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// --- Batch cards ---------------------------------------------------------

function FoodBatchCard({ delivery, onCancel, onAdvance }) {
  const order = delivery.raw;
  const status = delivery.workflowStatus;

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-black text-lg">{order.restaurantName}</h3>
          <p className="text-sm text-gray-500 mt-1">Customer: {order.customerName}</p>
          <p className="text-sm text-gray-500 mt-1">Order #{order.id}</p>
        </div>
        <div className="text-right">
          <span className="inline-block bg-[#FCF0D6] text-[#9C7311] px-3 py-1 rounded-full text-sm font-bold">
            {status}
          </span>
          <p className="font-black mt-2">₦{order.total.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {FOOD_STEP_LABELS.map((label, i) => {
          const isActive = FOOD_STEPS.indexOf(status) >= i;
          return (
            <div
              key={label}
              className={`text-center p-2 rounded-lg text-xs font-bold ${
                isActive ? "bg-[#E3EAE6] text-[#3B6255]" : "bg-gray-100 text-gray-400"
              }`}
            >
              {label}
            </div>
          );
        })}
      </div>

      <div className="mt-5 space-y-2">
        {status === "Accepted by Rider" && (
          <>
            <button
              onClick={() => onAdvance(delivery.poolId, "Picked Up")}
              className="w-full bg-[#F4B740] hover:bg-[#DFA52F] text-[#1F1B16] py-3 rounded-xl font-bold transition"
            >
              📦 Pick Up Food
            </button>
            <button
              onClick={() => onCancel(delivery.poolId)}
              className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 py-2.5 rounded-xl font-bold transition"
            >
              Cancel Pickup
            </button>
          </>
        )}

        {status === "Picked Up" && (
          <button
            onClick={() => onAdvance(delivery.poolId, "Out for Delivery")}
            className="w-full bg-[#3B6255] hover:bg-[#2E4C42] text-white py-3 rounded-xl font-bold transition"
          >
            🏍️ Go to Customer
          </button>
        )}

        {status === "Out for Delivery" && (
          <button
            onClick={() => onAdvance(delivery.poolId, "Delivered")}
            className="w-full bg-[#E8491D] hover:bg-[#C73A15] text-white py-3 rounded-xl font-bold transition"
          >
            ✓ Mark as Delivered
          </button>
        )}
      </div>
    </div>
  );
}

function CourierBatchCard({ delivery, onCancel, onAdvance }) {
  const order = delivery.raw;
  const status = delivery.workflowStatus;

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-black text-lg flex items-center gap-2">
            <FaBoxOpen className="text-[#3B6255]" /> Package Delivery
          </h3>
          <p className="text-sm text-gray-500 mt-1">Customer: {order.customerName}</p>
          <p className="text-sm text-gray-500 mt-1">Order #{order.id}</p>
        </div>
        <div className="text-right">
          <span className="inline-block bg-[#FCF0D6] text-[#9C7311] px-3 py-1 rounded-full text-sm font-bold">
            {status}
          </span>
          {order.deliveryFee ? (
            <p className="font-black mt-2">
              ₦{Number(order.deliveryFee).toLocaleString()}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <FaMapMarkerAlt className="text-[#3B6255]" size={13} />
          Pickup: {order.pickupAddress}
        </div>
        <div className="flex items-center gap-2">
          <FaMapMarkerAlt className="text-[#E8491D]" size={13} />
          Drop-off: {order.destinationAddress}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {status === "Rider Assigned" && (
          <button
            onClick={() => onCancel(delivery.poolId)}
            className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 py-2.5 rounded-xl font-bold transition"
          >
            Cancel Pickup
          </button>
        )}

        {(status === "Rider Assigned" || status === "Out for Delivery") && (
          <button
            onClick={() => onAdvance(delivery.poolId, "Delivered")}
            className="w-full bg-[#E8491D] hover:bg-[#C73A15] text-white py-3 rounded-xl font-bold transition"
          >
            ✓ Mark as Delivered
          </button>
        )}
      </div>
    </div>
  );
}

export default RiderDashboard;