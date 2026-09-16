import { useEffect, useState } from "react";
import { FaBoxOpen, FaMapMarkerAlt, FaMotorcycle } from "react-icons/fa";
import { OFFER_WINDOW_SECONDS } from "../utils/deliveryPools";

// A single full-screen offer card. The parent (RiderDashboard) owns
// which delivery is being offered right now — this component just
// counts down and reports back accept / ignore / expired.
function DeliveryOfferPopup({ offer, onAccept, onIgnore }) {
  const [secondsLeft, setSecondsLeft] = useState(OFFER_WINDOW_SECONDS);

  // Restart the countdown every time a new offer comes in.
  useEffect(() => {
    setSecondsLeft(OFFER_WINDOW_SECONDS);
  }, [offer?.poolId]);

  useEffect(() => {
    if (!offer) return;

    if (secondsLeft <= 0) {
      onIgnore(offer, { expired: true });
      return;
    }

    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [offer, secondsLeft, onIgnore]);

  if (!offer) return null;

  const isCourier = offer.type === "courier";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#FCE7DD] text-[#E8491D] p-3 rounded-xl">
            {isCourier ? <FaBoxOpen size={20} /> : <FaMotorcycle size={20} />}
          </div>
          <div>
            <p className="text-xs font-bold text-[#8A8378] uppercase tracking-wide">
              {isCourier ? "New Courier Delivery" : "New Food Delivery"}
            </p>
            <h3 className="font-black text-lg text-[#1F1B16]">
              {offer.title}
            </h3>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaMapMarkerAlt className="text-[#3B6255]" size={13} />
            <span>Pickup: {offer.pickupLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaMapMarkerAlt className="text-[#E8491D]" size={13} />
            <span>Drop-off: {offer.dropoffLabel}</span>
          </div>
        </div>

        {offer.fee ? (
          <p className="text-sm font-bold text-green-600 mb-4">
            Fee: ₦{Number(offer.fee).toLocaleString()}
          </p>
        ) : null}

        <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
          <div
            className="bg-[#F4B740] h-2 rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${(secondsLeft / OFFER_WINDOW_SECONDS) * 100}%`,
            }}
          />
        </div>

        <p className="text-xs text-gray-500 mb-5">
          Available for {secondsLeft} seconds
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onIgnore(offer, { expired: false })}
            className="py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            Ignore
          </button>
          <button
            onClick={() => onAccept(offer)}
            className="py-3 rounded-xl font-bold bg-[#E8491D] hover:bg-[#C73A15] text-white transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeliveryOfferPopup;