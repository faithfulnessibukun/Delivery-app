import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaBoxOpen,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaClock,
  FaArrowLeft,
} from "react-icons/fa";
import toast from "react-hot-toast";
import RiderSidebar from "../components/RiderSidebar";
import { getCurrentUser } from "../utils/supabaseStorage";
import { getMyCompleted } from "../utils/deliveryPools";


function RiderCompletedDeliveries() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rider, setRider] = useState(null);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);

  // Load the logged-in rider, then their completed deliveries — using
  // the same deliveryPool source RiderDashboard.jsx already reads from,
  // so both pages always agree on what's "completed".
  useEffect(() => {
    const loadRiderAndDeliveries = async () => {
      const currentUser = await getCurrentUser();

      if (!currentUser || currentUser.role !== "rider") {
        toast.error("Please login as a rider.");
        navigate("/");
        return;
      }

      setRider(currentUser);

      const completed = await getMyCompleted(currentUser.id);
      setCompletedDeliveries(completed || []);
    };

    loadRiderAndDeliveries();

    const interval = setInterval(loadRiderAndDeliveries, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  if (!rider) {
    return null;
  }

  const totalEarnings = completedDeliveries.reduce(
    (total, delivery) => total + Number(delivery.fee || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Sidebar */}
      <RiderSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#1F1B16] text-white p-3 rounded-xl shadow-lg"
      >
        ☰
      </button>

      {/* Header */}
      <header className="md:ml-64 bg-[#1F1B16] text-white px-6 py-5 shadow-lg">
        <div className="flex items-center justify-between gap-4">

          <div className="pl-12 md:pl-0">
            <h1 className="text-2xl font-black">
              Completed Deliveries
            </h1>

            <p className="text-[#C9C2B4] text-sm mt-1">
              View all deliveries you have successfully completed.
            </p>
          </div>

          <button
            onClick={() => navigate("/rider-dashboard")}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl font-bold transition"
          >
            <FaArrowLeft />
            <span className="hidden sm:inline">
              Dashboard
            </span>
          </button>

        </div>
      </header>

      {/* Main */}
      <main className="md:ml-64 min-h-screen p-4 pt-20 md:p-6 md:pt-6">

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">

          {/* Completed */}
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Completed Deliveries
                </p>

                <h2 className="text-3xl font-black text-[#1F1B16] mt-2">
                  {completedDeliveries.length}
                </h2>
              </div>

              <div className="bg-[#E3EAE6] text-[#3B6255] p-4 rounded-xl">
                <FaCheckCircle size={22} />
              </div>

            </div>
          </div>

          {/* Earnings */}
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Delivery Earnings
                </p>

                <h2 className="text-3xl font-black text-[#1F1B16] mt-2">
                  ₦{totalEarnings.toLocaleString()}
                </h2>
              </div>

              <div className="bg-[#FCF0D6] text-[#9C7311] p-4 rounded-xl">
                <FaMoneyBillWave size={22} />
              </div>

            </div>
          </div>

          {/* Rider */}
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Rider
                </p>

                <h2 className="text-xl font-black text-[#1F1B16] mt-2">
                  {rider.full_name}
                </h2>
              </div>

              <div className="bg-[#FCE7DD] text-[#E8491D] p-4 rounded-xl">
                <FaBoxOpen size={22} />
              </div>

            </div>
          </div>

        </div>

        {/* Page Title */}
        <div className="mb-5">
          <h2 className="text-2xl font-black text-[#1F1B16]">
            Delivery History
          </h2>

          <p className="text-gray-500 mt-1">
            Your successfully completed deliveries — food and packages.
          </p>
        </div>

        {/* Empty State */}
        {completedDeliveries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">

            <FaCheckCircle
              className="mx-auto text-gray-300 mb-4"
              size={50}
            />

            <h3 className="text-xl font-bold text-[#1F1B16]">
              No Completed Deliveries
            </h3>

            <p className="text-gray-500 mt-2">
              Deliveries you complete will appear here.
            </p>

            <button
              onClick={() => navigate("/rider-dashboard")}
              className="mt-6 bg-[#E8491D] hover:bg-[#C73A15] text-white px-6 py-3 rounded-xl font-bold transition"
            >
              View Available Deliveries
            </button>

          </div>
        ) : (

          /* Completed Delivery Cards */
          <div className="space-y-5">

            {completedDeliveries.map((delivery) => {
              const order = delivery.raw || {};
              const isFood = delivery.type === "food";

              return (
                <div
                  key={delivery.poolId}
                  className="bg-white rounded-2xl shadow p-6"
                >

                  {/* Top */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                    <div>
                      <div className="flex items-center gap-3">

                        <div className="bg-[#E3EAE6] text-[#3B6255] p-3 rounded-xl">
                          <FaCheckCircle />
                        </div>

                        <div>
                          <h3 className="text-lg font-black text-[#1F1B16]">
                            {delivery.title ||
                              (isFood ? order.restaurantName : "Package Delivery")}
                          </h3>

                          <p className="text-sm text-gray-500">
                            Order #{order.id}
                          </p>
                        </div>

                      </div>
                    </div>

                    <div className="text-left sm:text-right">

                      <span className="inline-flex items-center gap-2 bg-[#E3EAE6] text-[#3B6255] px-3 py-1.5 rounded-full text-sm font-bold">
                        <FaCheckCircle />
                        Delivered
                      </span>

                      {isFood && (
                        <p className="font-black text-lg mt-2">
                          ₦{Number(order.total || 0).toLocaleString()}
                        </p>
                      )}

                    </div>

                  </div>

                  {/* Divider */}
                  <div className="border-t my-5" />

                  {/* Delivery Information */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3">

                        <FaMapMarkerAlt className="text-[#E8491D]" />

                        <div>
                          <p className="text-xs text-gray-500">
                            {isFood ? "Restaurant" : "Pickup"}
                          </p>

                          <p className="font-bold text-sm">
                            {isFood ? order.restaurantName : order.pickupAddress}
                          </p>
                        </div>

                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3">

                        <FaMapMarkerAlt className="text-[#3B6255]" />

                        <div>
                          <p className="text-xs text-gray-500">
                            Customer
                          </p>

                          <p className="font-bold text-sm">
                            {order.customerName}
                          </p>
                        </div>

                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3">

                        <FaClock className="text-gray-500" />

                        <div>
                          <p className="text-xs text-gray-500">
                            Completed
                          </p>

                          <p className="font-bold text-sm">
                            {order.deliveredAt || order.placedAt
                              ? new Date(
                                  order.deliveredAt || order.placedAt
                                ).toLocaleString()
                              : "—"}
                          </p>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* Items (food deliveries only) */}
                  {isFood && order.items?.length > 0 && (
                    <div className="mt-5 bg-[#FBF6EE] rounded-xl p-4">

                      <p className="font-bold mb-3">
                        Order Items
                      </p>

                      <div className="space-y-2">

                        {order.items.map((item, index) => (

                          <div
                            key={index}
                            className="flex justify-between gap-4 text-sm"
                          >

                            <span>
                              {item.name} × {item.quantity}
                            </span>

                            <span className="font-semibold">
                              ₦{(
                                Number(item.price || 0) *
                                Number(item.quantity || 0)
                              ).toLocaleString()}
                            </span>

                          </div>

                        ))}

                      </div>

                    </div>
                  )}

                  {/* Package details (courier deliveries only) */}
                  {!isFood && (
                    <div className="mt-5 bg-[#FBF6EE] rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Drop-off</p>
                        <p className="font-bold text-sm">
                          {order.destinationAddress}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Package Size</p>
                        <p className="font-bold text-sm">{order.packageSize}</p>
                      </div>
                    </div>
                  )}

                  {/* Earnings */}
                  <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#E3EAE6] rounded-xl p-4">

                    <div className="flex items-center gap-3">

                      <div className="bg-[#3B6255] text-white p-3 rounded-xl">
                        <FaMoneyBillWave />
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">
                          Rider Delivery Fee
                        </p>

                        <p className="font-black text-[#3B6255]">
                          Payment received
                        </p>
                      </div>

                    </div>

                    <p className="text-xl font-black text-[#3B6255]">
                      +₦{Number(delivery.fee || 0).toLocaleString()}
                    </p>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </main>
    </div>
  );
}

export default RiderCompletedDeliveries;