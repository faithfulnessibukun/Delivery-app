import { useEffect, useState } from "react";
import {
  FaMotorcycle,
  FaMapMarkerAlt,
  FaBoxOpen,
  FaCheckCircle,
} from "react-icons/fa";
import LiveDeliveryMap from "../components/LiveDeliveryMap";

function RiderCourierDelivery() {
  const [order, setOrder] = useState(null);
  const [locationError, setLocationError] = useState("");

  // Get the courier order assigned to this rider
  const loadOrder = () => {
    const currentUser =
      JSON.parse(localStorage.getItem("currentUser")) || null;

    const orders =
      JSON.parse(localStorage.getItem("courierOrders")) || [];

    if (!currentUser) return;

    const riderOrder = orders.find(
      (item) =>
        item.riderId === currentUser.id &&
        item.status !== "Delivered"
    );

    setOrder(riderOrder || null);
  };

  useEffect(() => {
    loadOrder();

    window.addEventListener("courierOrdersUpdated", loadOrder);

    return () => {
      window.removeEventListener(
        "courierOrdersUpdated",
        loadOrder
      );
    };
  }, []);

  // Start live rider GPS tracking
  useEffect(() => {
    if (!order) return;

    if (!navigator.geolocation) {
      setLocationError(
        "Your browser does not support GPS location."
      );
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const riderLatitude = position.coords.latitude;
        const riderLongitude = position.coords.longitude;

        const orders =
          JSON.parse(localStorage.getItem("courierOrders")) || [];

        const updatedOrders = orders.map((item) => {
          if (item.id !== order.id) {
            return item;
          }

          return {
            ...item,
            riderLatitude,
            riderLongitude,
            status: "Out for Delivery",
          };
        });

        localStorage.setItem(
          "courierOrders",
          JSON.stringify(updatedOrders)
        );

        const updatedOrder = updatedOrders.find(
          (item) => item.id === order.id
        );

        setOrder(updatedOrder);

        // Tell customer page that rider location changed
        window.dispatchEvent(
          new Event("courierOrdersUpdated")
        );
      },

      (error) => {
        console.error(error);

        setLocationError(
          "Please allow location access so your location can be shared with the customer."
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [order?.id]);

  // No active delivery
  if (!order) {
    return (
      <div className="min-h-screen bg-[#FBF6EE] p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md w-full">
          <FaBoxOpen
            className="mx-auto mb-4 text-[#D8CDB6]"
            size={45}
          />

          <h1 className="text-xl font-black text-[#1F1B16]">
            No Active Delivery
          </h1>

          <p className="text-sm text-[#8A8378] mt-2">
            You don't currently have a courier delivery assigned to you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF6EE] p-6 md:p-10">

      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-black text-[#1F1B16]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Active Courier Delivery
        </h1>

        <p className="text-[#8A8378] mt-1">
          You are currently delivering a package.
        </p>
      </div>

      {/* Delivery status */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">

        <div className="flex items-center gap-4">

          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <FaMotorcycle
              className="text-green-700"
              size={24}
            />
          </div>

          <div>
            <p className="text-xs text-[#8A8378]">
              DELIVERY STATUS
            </p>

            <h2 className="text-xl font-black text-[#1F1B16]">
              {order.status}
            </h2>
          </div>

        </div>

      </div>

      {/* GPS error */}
      {locationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          {locationError}
        </div>
      )}
       {/* Live Delivery Map */}
<div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
  <h2 className="font-black text-lg text-[#1F1B16] mb-4">
    Live Delivery Map
  </h2>

  {order.riderLatitude && order.riderLongitude ? (
    <LiveDeliveryMap
      customerLatitude={order.customerLatitude}
      customerLongitude={order.customerLongitude}
      riderLatitude={order.riderLatitude}
      riderLongitude={order.riderLongitude}
    />
  ) : (
    <div className="h-64 flex items-center justify-center bg-[#FBF6EE] rounded-xl">
      <div className="text-center">
        <FaMotorcycle
          className="mx-auto mb-3 text-[#3B6255]"
          size={30}
        />

        <p className="font-bold text-[#1F1B16]">
          Getting your location...
        </p>

        <p className="text-sm text-[#8A8378] mt-1">
          Please allow GPS access.
        </p>
      </div>
    </div>
  )}
</div>
      {/* Delivery route */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">

        <h2 className="font-black text-lg text-[#1F1B16] mb-6">
          Delivery Route
        </h2>

        {/* Rider */}
        <div className="flex gap-4">

          <div className="flex flex-col items-center">

            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
              <FaMotorcycle
                className="text-green-700"
              />
            </div>

            <div className="w-1 h-16 bg-gray-200 my-1"></div>

          </div>

          <div className="pt-1">
            <p className="text-xs text-[#8A8378]">
              YOU ARE HERE
            </p>

            <p className="font-bold text-[#1F1B16]">
              Rider GPS Location
            </p>

            {order.riderLatitude && order.riderLongitude ? (
              <p className="text-xs text-green-600 mt-1">
                GPS location is being shared
              </p>
            ) : (
              <p className="text-xs text-[#8A8378] mt-1">
                Waiting for GPS location...
              </p>
            )}
          </div>

        </div>

        {/* Customer */}
        <div className="flex gap-4">

          <div className="flex flex-col items-center">

            <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
              <FaMapMarkerAlt
                className="text-[#E8491D]"
              />
            </div>

          </div>

          <div className="pt-1">

            <p className="text-xs text-[#8A8378]">
              CUSTOMER DESTINATION
            </p>

            <p className="font-bold text-[#1F1B16]">
              {order.destinationAddress}
            </p>

          </div>

        </div>

      </div>

      {/* Customer information */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">

        <h2 className="font-black text-lg text-[#1F1B16] mb-4">
          Customer
        </h2>

        <p className="font-bold text-[#1F1B16]">
          {order.customerName}
        </p>

        <p className="text-sm text-[#8A8378] mt-1">
          {order.customerPhone}
        </p>

      </div>

      {/* Package information */}
      <div className="bg-white rounded-2xl shadow-lg p-6">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-xs text-[#8A8378]">
              PACKAGE
            </p>

            <p className="font-bold text-[#1F1B16]">
              {order.packageSize}
            </p>
          </div>

          <div className="text-right">

            <p className="text-xs text-[#8A8378]">
              DELIVERY FEE
            </p>

            <p className="font-black text-[#1F1B16]">
              ₦{Number(order.deliveryFee).toLocaleString()}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default RiderCourierDelivery;