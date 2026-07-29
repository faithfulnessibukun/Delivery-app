import { useState } from "react";
import { FaReceipt, FaClock } from "react-icons/fa";
import CustomerNav from "../components/CustomerNav";
import { getStoredArray } from "../utils/storage";

// Shows every order the customer has placed so far. Orders are created in
// CartDrawer.jsx's "Place Order" button and saved to localStorage — this
// page just reads that list back out and displays it, newest first.
function Orders() {
  const [orders] = useState(() => getStoredArray("orders"));

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
