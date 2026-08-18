import { useEffect, useState } from "react";
import {
  FaBoxOpen,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaMotorcycle,
} from "react-icons/fa";
import { CURRENT_USER_KEYS } from "../utils/storage";

function RiderCourierOrders() {
  const [courierOrders, setCourierOrders] = useState([]);

  const loadCourierOrders = () => {
    const orders =
      JSON.parse(localStorage.getItem("courierOrders")) || [];

    setCourierOrders(orders);
  };

  // PUT handleAcceptDelivery HERE
  const handleAcceptDelivery = (orderId) => {
    const currentUser =
      JSON.parse(localStorage.getItem(CURRENT_USER_KEYS.rider)) || null;

    if (!currentUser) {
      alert("Please login as a rider first.");
      return;
    }

    // Accepting is what commits the rider to the job, so this is where
    // they set the delivery fee they're charging for it.
    const input = prompt("Set your delivery fee for this job (₦):");
    if (input === null) return; // rider cancelled

    const fee = Number(input);
    if (!input.trim() || Number.isNaN(fee) || fee <= 0) {
      alert("Please enter a valid delivery fee.");
      return;
    }

    const orders =
      JSON.parse(localStorage.getItem("courierOrders")) || [];

    const updatedOrders = orders.map((order) => {
      if (order.id !== orderId) {
        return order;
      }

      return {
        ...order,

        riderId: currentUser.id,
        riderName: currentUser.fullName || "Rider",

        status: "Rider Assigned",

        deliveryFee: fee,

        riderLatitude: null,
        riderLongitude: null,

        assignedAt: Date.now(),
      };
    });

    localStorage.setItem(
      "courierOrders",
      JSON.stringify(updatedOrders)
    );

    window.dispatchEvent(
      new Event("courierOrdersUpdated")
    );

    setCourierOrders(updatedOrders);

    alert("Delivery accepted!");
    window.location.href = "/rider-courier-delivery";
  };

  useEffect(() => {
    loadCourierOrders();

    window.addEventListener(
      "courierOrdersUpdated",
      loadCourierOrders
    );

    return () => {
      window.removeEventListener(
        "courierOrdersUpdated",
        loadCourierOrders
      );
    };
  }, []);

  

  return (
    <div className="min-h-screen bg-[#FBF6EE] p-6 md:p-10">

      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-black text-[#1F1B16]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Courier Orders
        </h1>

        <p className="text-[#8A8378] mt-1">
          Package delivery requests waiting for riders
        </p>
      </div>

      {/* No orders */}
      {courierOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <FaBoxOpen
            className="mx-auto mb-4 text-[#D8CDB6]"
            size={40}
          />

          <h2 className="font-bold text-[#1F1B16] text-lg">
            No courier orders
          </h2>

          <p className="text-sm text-[#8A8378] mt-2">
            New package delivery requests will appear here.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {courierOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-lg p-5"
            >

              {/* Order header */}
              <div className="flex items-start justify-between gap-3">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-[#E3EAE6] flex items-center justify-center">
                    <FaBoxOpen className="text-[#3B6255]" />
                  </div>

                  <div>
                    <h2 className="font-black text-[#1F1B16]">
                      Package Delivery
                    </h2>

                    <p className="text-xs text-[#8A8378]">
                      Order #{order.id}
                    </p>
                  </div>

                </div>

                <span className="bg-[#FCF0D6] text-[#9C7311] text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  {order.status}
                </span>

              </div>

              {/* Customer */}
              <div className="mt-5 bg-[#FBF6EE] rounded-xl p-3">

                <div className="flex items-center gap-2">
                  <FaUser
                    className="text-[#3B6255]"
                    size={13}
                  />

                  <span className="text-sm font-bold text-[#1F1B16]">
                    {order.customerName}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <FaPhone
                    className="text-[#8A8378]"
                    size={12}
                  />

                  <span className="text-xs text-[#8A8378]">
                    {order.customerPhone}
                  </span>
                </div>

              </div>

              {/* Pickup */}
              <div className="mt-5">

                <p className="text-xs font-bold text-[#8A8378] mb-2">
                  PICKUP LOCATION
                </p>

                <div className="flex gap-3">

                  <FaMapMarkerAlt
                    className="text-[#3B6255] mt-1 shrink-0"
                    size={14}
                  />

                  <p className="text-sm font-medium text-[#1F1B16]">
                    {order.pickupAddress}
                  </p>

                </div>

              </div>

              {/* Destination */}
              <div className="mt-4">

                <p className="text-xs font-bold text-[#8A8378] mb-2">
                  DROP-OFF LOCATION
                </p>

                <div className="flex gap-3">

                  <FaMapMarkerAlt
                    className="text-[#E8491D] mt-1 shrink-0"
                    size={14}
                  />

                  <p className="text-sm font-medium text-[#1F1B16]">
                    {order.destinationAddress}
                  </p>

                </div>

              </div>

              {/* Package information */}
              <div className="mt-5 flex items-center justify-between border-t border-[#EDE4D3] pt-4">

                <div>
                  <p className="text-xs text-[#8A8378]">
                    Package
                  </p>

                  <p className="font-bold text-[#1F1B16]">
                    {order.packageSize}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-[#8A8378]">
                    Delivery Fee
                  </p>

                  <p className="font-black text-[#1F1B16]">
                    {order.deliveryFee
                      ? `₦${Number(order.deliveryFee).toLocaleString()}`
                      : "You set this"}
                  </p>
                </div>

              </div>

              {/* Accept button */}
              {order.status === "Waiting for Rider" && (
  <button
    onClick={() => handleAcceptDelivery(order.id)}
    className="mt-5 w-full bg-[#3B6255] hover:bg-[#2E4C42] text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
  >
    <FaMotorcycle size={14} />
    Accept Delivery
  </button>
)}

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default RiderCourierOrders;