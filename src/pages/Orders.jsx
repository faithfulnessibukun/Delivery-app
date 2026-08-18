import {  useEffect ,useState } from "react";
import { FaReceipt, FaClock } from "react-icons/fa";
import CustomerNav from "../components/CustomerNav";
import { getStoredArray } from "../utils/storage";
import LiveDeliveryMap from "../components/LiveDeliveryMap";

// Shows every order the customer has placed so far. Orders are created in
// CartDrawer.jsx's "Place Order" button and saved to localStorage — this
// page just reads that list back out and displays it, newest first.
function Orders() {
  const [orders, setOrders] = useState(() => getStoredArray("orders"));

useEffect(() => {
  const loadOrders = () => {
    setOrders(getStoredArray("orders"));
  };

  // Load the latest orders/location immediately
  loadOrders();

  // Listen for rider location updates
  window.addEventListener("ordersUpdated", loadOrders);

  return () => {
    window.removeEventListener("ordersUpdated", loadOrders);
  };
}, []);

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
            {orders.map((order) => (
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
                    <p className="text-xs text-[#8A8378] flex items-center gap-1.5">
                      <FaClock size={11} />
                      {new Date(order.placedAt).toLocaleString()}
                    </p>
                    <p className="font-bold text-[#1F1B16] mt-1">
                      {order.items.length} item{order.items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="bg-[#FCF0D6] text-[#9C7311] text-xs font-bold px-3 py-1 rounded-full shrink-0">
                    {order.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1">
                  {order.items.map((item, index) => (
                    <p key={index} className="text-sm text-[#5A5448]">
                      {item.quantity}× {item.name}
                    </p>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-[#EDE4D3] flex items-center justify-between">
                  <span className="text-sm font-bold text-[#8A8378]">Total</span>
                  <span className="font-black text-[#1F1B16]">
                    ₦{order.total.toLocaleString()}
                  </span>
                </div>
                {/* Delivery Tracking */}
<div className="mt-4 bg-[#F5FBEF] border border-[#D8EACD] rounded-2xl p-4">
  <div className="flex items-center gap-3">

    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
      🚴
    </div>

    <div>
      <p className="font-black text-[#1F1B16]">
        {order.deliveryStatus === "Out for Delivery"
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

  {/* Rider details */}
  {order.riderName && (
    <div className="mt-4 bg-white rounded-xl p-3 flex items-center justify-between">
      <div>
        <p className="text-xs text-[#8A8378]">
          Your Rider
        </p>

        <p className="font-bold text-[#1F1B16]">
          {order.riderName}
        </p>
      </div>

      <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">
        {order.deliveryStatus}
      </span>
    </div>
  )}
</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CustomerNav />
    </div>
  );
}

export default Orders;
