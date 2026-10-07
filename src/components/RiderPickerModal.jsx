import { useEffect, useState } from "react";
import { FaMotorcycle, FaTimes, FaSyncAlt } from "react-icons/fa";
import {
  getNearbyRiders,
  getRestaurantForVendor,
  saveRestaurantLocation,
} from "../utils/supabaseStorage";
import { formatDistance } from "../utils/geo";

const RADIUS_KM = 10;
const REFRESH_MS = 10000;

function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      reject,
      { timeout: 10000 }
    );
  });
}

// Shown when a vendor marks an order Ready: sets the delivery fee and
// lets the vendor pick which nearby online riders are offered the order.
function RiderPickerModal({ order, vendorId, onConfirm, onClose }) {
  const [fee, setFee] = useState(order.riderEarnings || "");
  const [riders, setRiders] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [origin, setOrigin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Work out where the restaurant is (saved once, then reused).
  useEffect(() => {
    const locate = async () => {
      const restaurant = await getRestaurantForVendor(vendorId);
      if (restaurant?.lat != null && restaurant?.lng != null) {
        setOrigin({ lat: restaurant.lat, lng: restaurant.lng });
        return;
      }
      try {
        const { latitude, longitude } = await getBrowserPosition();
        setOrigin({ lat: latitude, lng: longitude });
        saveRestaurantLocation(vendorId, latitude, longitude).catch(() => {});
      } catch {
        setError(
          "Allow location access so we can find riders near your restaurant."
        );
        setLoading(false);
      }
    };
    locate();
  }, [vendorId]);

  // Keep the nearby-rider list fresh while the modal is open.
  useEffect(() => {
    if (!origin) return;
    let cancelled = false;

    const load = async () => {
      const nearby = await getNearbyRiders(origin.lat, origin.lng, {
        maxKm: RADIUS_KM,
        excludeIds: [order.customerId],
      });
      if (cancelled) return;
      setRiders(nearby);
      // Drop picks that went offline or out of range.
      setSelected((prev) => {
        const ids = new Set(nearby.map((r) => r.id));
        return new Set([...prev].filter((id) => ids.has(id)));
      });
      setLoading(false);
    };

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [origin, order.customerId]);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const feeNumber = Number(fee);
  const feeValid = fee !== "" && !Number.isNaN(feeNumber) && feeNumber > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-black text-lg">Choose riders</h3>
            <p className="text-sm text-gray-500">
              Order for {order.customerName} — within {RADIUS_KM} km
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <label className="block text-sm font-bold mb-1">
          Delivery fee for the rider (₦)
        </label>
        <input
          type="number"
          min="0"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />

        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold">Nearby riders</p>
          <FaSyncAlt className="text-gray-400" size={12} title="Refreshes automatically" />
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {loading && !error ? (
          <p className="text-sm text-gray-500 py-4 text-center">Looking for riders…</p>
        ) : riders.length === 0 && !error ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No riders are online nearby right now.
          </p>
        ) : (
          <ul className="space-y-2 mb-4">
            {riders.map((r) => (
              <li key={r.id}>
                <label className="flex items-center gap-3 border rounded-xl p-3 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                  <FaMotorcycle className="text-[#E8491D]" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold truncate">{r.name}</span>
                    <span className="block text-xs text-gray-500">
                      {[r.vehicleType, r.vehiclePlate].filter(Boolean).join(" · ") ||
                        "Rider"}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-[#3B6255]">
                    {formatDistance(r.distanceKm)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={!feeValid}
            onClick={() => onConfirm({ fee: feeNumber, riderIds: [] })}
            className="py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 text-sm"
          >
            Offer to all riders
          </button>
          <button
            disabled={!feeValid || selected.size === 0}
            onClick={() => onConfirm({ fee: feeNumber, riderIds: [...selected] })}
            className="py-3 rounded-xl font-bold bg-[#E8491D] hover:bg-[#C73A15] text-white disabled:opacity-50 text-sm"
          >
            Offer to {selected.size || ""} selected
          </button>
        </div>
      </div>
    </div>
  );
}

export default RiderPickerModal;
