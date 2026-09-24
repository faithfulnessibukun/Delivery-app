import { useEffect, useState } from "react";
import { FaReceipt, FaClock, FaCheckCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import CustomerNav from "../components/CustomerNav";
import { getOrders, getCurrentUser } from "../utils/supabaseStorage";
import LiveDeliveryMap from "../components/LiveDeliveryMap";
import { supabase } from "../lib/supabase";

function displayStatus(order) {
  return order.riderId ? order.deliveryStatus : order.status;
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        setOrders([]);
        setIsLoading(false);
        return;
      }
      const customerOrders = await getOrders({ customerId: user.id });
      setOrders(customerOrders || []);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- Customer Confirm Delivery Logic ---------------------------------
  const handleConfirmDelivery = async (orderId) => {
    const confirm = window.confirm("Have you received your order and want to confirm delivery?");
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          delivery_status: "Delivered",
          status: "Delivered",
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (error) {
        console.error("Error marking delivery as complete:", error);
        toast.error("Failed to confirm delivery. Please try again.");
      } else {
        toast.success("Order confirmed as delivered! Thank you.");
        loadOrders();
      }
    } catch (err) {
      console.error("Delivery confirmation error:", err);
      toast.error("An error occurred while confirming delivery.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF6EE] pb-24">
      <div className="bg-[#1F1B16] text-white px-6 md:px-10 lg:px-16 py-6 rounded-b-[2.5rem] shadow-lg">
        <h1
          className="text-3xl font-black tracking-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Your Orders
        </h1>
      </div>

      <div className="px-6 md:px-10 lg:px-16 mt-6">
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-[#8A8378]">
            <FaReceipt className="mx-auto mb-3 text-[#D8CDB6]" size={28} />
            No orders yet. Once you place one, it'll show up here.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const currentDeliveryStatus = displayStatus(order);
              const canCustomerConfirm =
                currentDeliveryStatus === "Out for Delivery" ||
                currentDeliveryStatus === "Arrived";

              return (
                <div key={order.id} className="bg-white rounded-2xl shadow p-5">
                  {/* Live rider tracking */}
                  {order.riderId &&
                    order.customerLatitude &&
                    order.customerLongitude && (
                      <div className="mb-5">
                        <LiveDeliveryMap
                          customerLatitude={order.customerLatitude}
                          customerLongitude={order.customerLongitude}
                          riderLatitude={order.riderLatitude}
                          riderLongitude={order.riderLongitude}
                        />
                      </div>
                    )}

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#1F1B16]">
                        {order.restaurantName || "Restaurant"}
                      </p>
                      <p className="text-xs text-[#8A8378] mt-1">
                        Order #{String(order.id).slice(-6)}
                      </p>
                      <p className="text-xs text-[#8A8378] flex items-center gap-1.5 mt-1">
                        <FaClock size={11} />
                        {new Date(order.placedAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-[#8A8378] mt-1">
                        {order.items.length} item{order.items.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="bg-[#FCF0D6] text-[#9C7311] text-xs font-bold px-3 py-1 rounded-full shrink-0">
                      {currentDeliveryStatus}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <div>
                          <p className="text-[#5A5448]">
                            {item.quantity}× {item.name}
                          </p>
                          {item.addOns?.length > 0 && (
                            <p className="text-xs text-[#8A8378] mt-0.5">
                              +{" "}
                              {item.addOns.map((addOn) => addOn.name).join(", ")}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-[#1F1B16] shrink-0">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#EDE4D3] flex items-center justify-between">
                    <span className="text-sm font-bold text-[#8A8378]">Total</span>
                    <span className="font-black text-[#1F1B16]">
                      ₦{order.total.toLocaleString()}
                    </span>
                  </div>

                  {/* Delivery Tracking & Confirm Delivery Action */}
                  {order.status === "Ready" &&
                    order.deliveryStatus !== "Delivered" && (
                      <div className="mt-4 bg-[#F5FBEF] border border-[#D8EACD] rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            🚴
                          </div>
                          <div>
                            <p className="font-black text-[#1F1B16]">
                              {order.deliveryStatus === "Arrived"
                                ? "Rider has arrived at your location!"
                                : order.deliveryStatus === "Out for Delivery"
                                ? "Rider is on the way"
                                : "Waiting for rider"}
                            </p>
                            <p className="text-xs text-[#8A8378] mt-1">
                              {order.riderName
                                ? `${order.riderName} is delivering your order`
                                : "A rider will be assigned to your order soon"}
                            </p>
                          </div>
                        </div>

                        {/* Customer Action Button */}
                        {canCustomerConfirm && (
                          <div className="mt-4">
                            <button
                              onClick={() => handleConfirmDelivery(order.id)}
                              className="w-full flex items-center justify-center gap-2 bg-[#3B6255] hover:bg-[#2E4C42] text-white py-3 px-4 rounded-xl font-bold transition shadow-md"
                            >
                              <FaCheckCircle size={16} /> Confirm Delivery Received
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CustomerNav />
    </div>
  );
}

export default Orders;