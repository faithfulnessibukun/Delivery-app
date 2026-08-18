import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LiveDeliveryMap from "../components/LiveDeliveryMap";
import {
  FaMotorcycle,
  FaMapMarkerAlt,
  FaBoxOpen,
  FaMoneyBillWave,
  FaClock,
  FaWallet,
  FaSignOutAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const riderIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function Rider() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
  localStorage.removeItem("currentUser");

  toast.success("Logged out successfully!");

  navigate("/");
};


  const [rider, setRider] = useState(null);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const watchIdRef = useRef(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [earnings, setEarnings] = useState(0);
  useEffect(() => {
  const currentUser =
    JSON.parse(localStorage.getItem("currentUser")) || null;

  if (!currentUser || currentUser.role !== "rider") {
    toast.error("Please login as a rider.");
    navigate("/");
    return;
  }

  setRider(currentUser);

// Load this rider's earnings
const savedEarnings = Number(
  localStorage.getItem(`riderEarnings_${currentUser.id}`)
) || 0;

setEarnings(savedEarnings);

const loadDeliveries = () => {

  
    const orders =
      JSON.parse(localStorage.getItem("orders")) || [];

    // Orders marked Ready by the vendor
    // and not yet accepted by another rider.
    const available = orders.filter(
      (order) =>
        order.status === "Ready" &&
        !order.riderId
    );

    // Orders already accepted by this rider.
    const mine = orders.filter(
      (order) =>
        order.riderId === currentUser.id
    );

    setAvailableDeliveries(available);
    setMyDeliveries(mine);
  };

  // Load orders when the rider page opens.
  loadDeliveries();

  // Listen for changes made by the vendor.
  window.addEventListener(
    "ordersUpdated",
    loadDeliveries
  );

  return () => {
    window.removeEventListener(
      "ordersUpdated",
      loadDeliveries
    );
  };
}, [navigate]);
useEffect(() => {
  if (!rider) return;

  if (!navigator.geolocation) {
    toast.error("Your browser does not support location.");
    return;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      const newLocation = {
        latitude,
        longitude,
        updatedAt: Date.now(),
      };

      setRiderLocation(newLocation);

      // Save rider's live location
      localStorage.setItem(
        `riderLocation_${rider.id}`,
        JSON.stringify(newLocation)
      );

      // Tell other pages that the rider location changed
      window.dispatchEvent(new Event("riderLocationUpdated"));
    },
    () => {
      toast.error("Please allow location access for live delivery tracking.");
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}, [rider]);
  const acceptDelivery = (orderId) => {
    const orders =
      JSON.parse(localStorage.getItem("orders")) || [];

    const updatedOrders = orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            riderId: rider.id,
            riderName: rider.fullName,
            status: "Accepted by Rider",
          }
        : order
    );

    localStorage.setItem(
      "orders",
      JSON.stringify(updatedOrders)
    );

    const accepted = updatedOrders.find(
      (order) => order.id === orderId
    );

    setAvailableDeliveries(
      updatedOrders.filter(
        (order) =>
          order.status === "Ready" &&
          !order.riderId
      )
    );

    setMyDeliveries(
      updatedOrders.filter(
        (order) => order.riderId === rider.id
      )
    );

    toast.success("Delivery accepted!");
  };
  const updateDeliveryStatus = (orderId, status) => {
  const orders =
    JSON.parse(localStorage.getItem("orders")) || [];

  const updatedOrders = orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          status,
        }
      : order
  );

  localStorage.setItem(
    "orders",
    JSON.stringify(updatedOrders)
  );
  // Give the rider ₦1,000 when the delivery is completed
if (status === "Delivered") {
  const DELIVERY_FEE = 1000;

  // Find the order being updated
  const deliveredOrder = updatedOrders.find(
    (order) => order.id === orderId
  );

  // Only pay if this order has NOT already paid the rider
  if (!deliveredOrder.riderPaid) {
    const newEarnings = earnings + DELIVERY_FEE;

    // Mark this specific order as already paid
    const ordersWithPayment = updatedOrders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            riderPaid: true,
            riderEarnings: DELIVERY_FEE,
          }
        : order
    );

    localStorage.setItem(
      "orders",
      JSON.stringify(ordersWithPayment)
    );

    setEarnings(newEarnings);

    localStorage.setItem(
      `riderEarnings_${rider.id}`,
      newEarnings.toString()
    );
  }
}

  setMyDeliveries(
    updatedOrders.filter(
      (order) => order.riderId === rider.id
    )
  );

  window.dispatchEvent(new Event("ordersUpdated"));

  if (status === "Picked Up") {
    toast.success("Food picked up!");
  }

  if (status === "Out for Delivery") {
    toast.success("You're on the way to the customer!");
  }

  if (status === "Delivered") {
    toast.success("Order delivered successfully!");
  }
};

  if (!rider) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-[#1F1B16] text-white px-6 py-4 shadow-lg">
        <div className="w-full">

          <div className="flex items-center justify-between gap-4">

  <div className="flex items-center gap-3">

    <div className="bg-[#F4B740] text-[#1F1B16] p-3 rounded-xl">
      <FaMotorcycle size={22} />
    </div>

    <div>
      <h1 className="text-2xl font-black">
        Rider Dashboard
      </h1>

      <p className="text-[#C9C2B4] text-sm">
        Welcome, {rider.fullName}
      </p>
    </div>

  </div>

  <button
    onClick={handleLogout}
    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl font-bold transition"
  >
    <FaSignOutAlt />
    <span className="hidden sm:inline">
      Logout
    </span>
  </button>

</div>

        </div>
      </div>

      <main className="min-h-screen w-auto p-4 pt-20 md:p-6 md:pt-6">
                {/* Customer Location Map */}
        {myDeliveries.length > 0 &&
          myDeliveries[0].customerLatitude &&
          myDeliveries[0].customerLongitude && (
            <section className="mb-6">
              <h2 className="text-2xl font-black text-[#1F1B16] mb-4">
                Customer Location
              </h2>

              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <MapContainer
                  center={[
                    myDeliveries[0].customerLatitude,
                    myDeliveries[0].customerLongitude,
                  ]}
                  zoom={15}
                  scrollWheelZoom={true}
                  className="w-full h-[300px]"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <Marker
                    position={[
                      myDeliveries[0].customerLatitude,
                      myDeliveries[0].customerLongitude,
                    ]}
                    icon={riderIcon}
                  >
                    <Popup>
                      <strong>Customer Location</strong>
                      <br />
                      {myDeliveries[0].customerName}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </section>
          )}
      {/* Rider Statistics */}
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

  {/* Total Earnings */}
  <div className="bg-white rounded-2xl shadow p-4">
    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-gray-500 font-medium">
          Total Earnings
        </p>

        <h2 className="text-3xl font-black text-[#1F1B16] mt-2">
          ₦{earnings.toLocaleString()}
        </h2>
      </div>

      <div className="bg-[#E3EAE6] text-[#3B6255] p-4 rounded-xl">
        <FaWallet size={22} />
      </div>

    </div>
  </div>

  {/* Completed Deliveries */}
  <div className="bg-white rounded-2xl shadow p-6">
    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-gray-500 font-medium">
          Completed Deliveries
        </p>

        <h2 className="text-3xl font-black text-[#1F1B16] mt-2">
          {
            myDeliveries.filter(
              (order) => order.status === "Delivered"
            ).length
          }
        </h2>
      </div>

      <div className="bg-[#FCF0D6] text-[#9C7311] p-4 rounded-xl">
        <FaBoxOpen size={22} />
      </div>

    </div>
  </div>

  {/* Pending Deliveries */}
  <div className="bg-white rounded-2xl shadow p-6">
    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-gray-500 font-medium">
          Active Deliveries
        </p>

        <h2 className="text-3xl font-black text-[#1F1B16] mt-2">
          {
            myDeliveries.filter(
              (order) => order.status !== "Delivered"
            ).length
          }
        </h2>
      </div>

      <div className="bg-[#FCE7DD] text-[#E8491D] p-4 rounded-xl">
        <FaMotorcycle size={22} />
      </div>

    </div>
  </div>

</div>

        {/* Available Deliveries */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black text-[#1F1B16]">
                Available Deliveries
              </h2>

              <p className="text-gray-500 mt-1">
                Orders that are ready for pickup.
              </p>
            </div>

            <div className="bg-[#E3EAE6] text-[#3B6255] px-4 py-2 rounded-full font-bold">
              {availableDeliveries.length} Available
            </div>
          </div>

          {availableDeliveries.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-10 text-center">
              <FaBoxOpen
                className="mx-auto text-gray-300 mb-4"
                size={40}
              />

              <h3 className="text-lg font-bold">
                No deliveries available
              </h3>

              <p className="text-gray-500 mt-2">
                New deliveries will appear here when restaurants
                mark orders as ready.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

              {availableDeliveries.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow p-6"
                >

                  <div className="flex justify-between items-start gap-4">

                    <div>
                      <h3 className="font-black text-lg">
                        {order.restaurantName}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        Order #{order.id}
                      </p>
                    </div>

                    <div className="text-green-600 font-black">
                      ₦{order.total.toLocaleString()}
                    </div>

                  </div>

                  <div className="border-t my-4" />

                  <div className="space-y-3">

                    <div className="flex items-center gap-3 text-gray-600">
                      <FaMapMarkerAlt className="text-[#E8491D]" />
                      <span>
                        Pickup: {order.restaurantName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <FaMapMarkerAlt className="text-[#3B6255]" />
                      <span>
                        Customer: {order.customerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-500 text-sm">
                      <FaClock />
                      <span>
                        {new Date(
                          order.placedAt
                        ).toLocaleString()}
                      </span>
                    </div>

                  </div>

                  <div className="mt-4 bg-[#FBF6EE] rounded-xl p-3">
                    <p className="font-bold text-sm mb-2">
                      Items
                    </p>

                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm py-1"
                      >
                        <span>
                          {item.name} × {item.quantity}
                        </span>

                        <span>
                          ₦{(
                            item.price * item.quantity
                          ).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => acceptDelivery(order.id)}
                    className="mt-5 w-full bg-[#E8491D] hover:bg-[#C73A15] text-white py-3 rounded-xl font-bold transition"
                  >
                    Accept Delivery
                  </button>

                </div>
              ))}

            </div>
          )}
        </section>

        {/* My Deliveries */}
        <section className="mt-8">

          <h2 className="text-2xl font-black text-[#1F1B16] mb-5">
            My Deliveries
          </h2>

          {myDeliveries.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
              You haven't accepted any deliveries yet.
            </div>
          ) : (
            <div className="space-y-4">

              {myDeliveries.map((order) => (
  <div
    key={order.id}
    className="bg-white rounded-2xl shadow p-6"
  >
    {/* Live delivery map */}
{order.customerLatitude && order.customerLongitude && (
  <div className="mb-5">
    <LiveDeliveryMap
      customerLatitude={order.customerLatitude}
      customerLongitude={order.customerLongitude}
      riderLatitude={order.riderLatitude}
      riderLongitude={order.riderLongitude}
    />
  </div>
)}

    {/* Order information */}
    <div className="flex justify-between items-start gap-4">

      <div>
        <h3 className="font-black text-lg">
          {order.restaurantName}
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          Customer: {order.customerName}
        </p>

        <p className="text-sm text-gray-500 mt-1">
          Order #{order.id}
        </p>
      </div>

      <div className="text-right">

        <span className="inline-block bg-[#FCF0D6] text-[#9C7311] px-3 py-1 rounded-full text-sm font-bold">
          {order.status}
        </span>

        <p className="font-black mt-2">
          ₦{order.total.toLocaleString()}
        </p>

      </div>

    </div>

    {/* Delivery progress */}
    <div className="mt-5 grid grid-cols-4 gap-2">

      <div
        className={`text-center p-2 rounded-lg text-xs font-bold ${
          [
            "Accepted by Rider",
            "Picked Up",
            "Out for Delivery",
            "Delivered",
          ].includes(order.status)
            ? "bg-[#E3EAE6] text-[#3B6255]"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        Accepted
      </div>

      <div
        className={`text-center p-2 rounded-lg text-xs font-bold ${
          [
            "Picked Up",
            "Out for Delivery",
            "Delivered",
          ].includes(order.status)
            ? "bg-[#E3EAE6] text-[#3B6255]"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        Pickup
      </div>

      <div
        className={`text-center p-2 rounded-lg text-xs font-bold ${
          [
            "Out for Delivery",
            "Delivered",
          ].includes(order.status)
            ? "bg-[#E3EAE6] text-[#3B6255]"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        On the Way
      </div>

      <div
        className={`text-center p-2 rounded-lg text-xs font-bold ${
          order.status === "Delivered"
            ? "bg-[#E3EAE6] text-[#3B6255]"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        Delivered
      </div>

    </div>

    {/* Action buttons */}
    <div className="mt-5">

      {order.status === "Accepted by Rider" && (
        <button
          onClick={() =>
            updateDeliveryStatus(
              order.id,
              "Picked Up"
            )
          }
          className="w-full bg-[#F4B740] hover:bg-[#DFA52F] text-[#1F1B16] py-3 rounded-xl font-bold transition"
        >
          📦 Pick Up Food
        </button>
      )}

      {order.status === "Picked Up" && (
        <button
          onClick={() =>
            updateDeliveryStatus(
              order.id,
              "Out for Delivery"
            )
          }
          className="w-full bg-[#3B6255] hover:bg-[#2E4C42] text-white py-3 rounded-xl font-bold transition"
        >
          🏍️ Go to Customer
        </button>
      )}

      {order.status === "Out for Delivery" && (
        <button
          onClick={() =>
            updateDeliveryStatus(
              order.id,
              "Delivered"
            )
          }
          className="w-full bg-[#E8491D] hover:bg-[#C73A15] text-white py-3 rounded-xl font-bold transition"
        >
          ✓ Mark as Delivered
        </button>
      )}

      {order.status === "Delivered" && (
        <div className="bg-[#E3EAE6] text-[#3B6255] rounded-xl p-4 text-center font-bold">
          ✓ Delivery Completed
        </div>
      )}

    </div>

  </div>
))}

            </div>
          )}

        </section>

        {/* Earnings History */}
        <section className="mt-8">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black text-[#1F1B16]">
                Earnings History
              </h2>

              <p className="text-gray-500 mt-1">
                Money earned from completed deliveries.
              </p>
            </div>

            <div className="bg-[#E3EAE6] text-[#3B6255] px-4 py-2 rounded-full font-bold">
              ₦{earnings.toLocaleString()}
            </div>
          </div>

          {myDeliveries.filter(
            (order) => order.status === "Delivered" && order.riderPaid
          ).length === 0 ? (

            <div className="bg-white rounded-2xl shadow p-8 text-center">

              <FaMoneyBillWave
                className="mx-auto text-gray-300 mb-4"
                size={35}
              />

              <h3 className="text-lg font-bold">
                No Earnings Yet
              </h3>

              <p className="text-gray-500 mt-2">
                Complete a delivery to start earning.
              </p>

            </div>

          ) : (

            <div className="bg-white rounded-2xl shadow overflow-hidden">

              {myDeliveries
                .filter(
                  (order) =>
                    order.status === "Delivered" &&
                    order.riderPaid
                )
                .map((order) => (

                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-4 p-5 border-b last:border-b-0"
                  >

                    <div>

                      <p className="font-bold text-[#1F1B16]">
                        {order.restaurantName}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        Order #{order.id}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(
                          order.placedAt
                        ).toLocaleString()}
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-green-600 font-black text-lg">
                        +₦{(
                          order.riderEarnings || 1000
                        ).toLocaleString()}
                      </p>

                      <p className="text-xs text-gray-500">
                        Delivery fee
                      </p>

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

export default Rider;