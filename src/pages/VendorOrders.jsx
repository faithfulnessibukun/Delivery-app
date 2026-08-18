import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaBars,
  FaStore,
  FaReceipt,
  FaUser,
  FaClock,
  FaMoneyBillWave,
} from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import { CURRENT_USER_KEYS } from "../utils/storage";

function VendorOrders() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
  const loadOrders = () => {
    const currentVendor = JSON.parse(
      localStorage.getItem(CURRENT_USER_KEYS.vendor)
    );

    if (!currentVendor || currentVendor.role !== "vendor") {
      toast.error("Please login as a vendor.");
      navigate("/");
      return;
    }

    setVendor(currentVendor);

    const savedOrders =
      JSON.parse(localStorage.getItem("orders")) || [];

    const vendorOrders = savedOrders.filter(
      (order) =>
        String(order.vendorId) === String(currentVendor?.id)
    );
    setOrders(vendorOrders);
  };

  loadOrders();

  window.addEventListener("ordersUpdated", loadOrders);
  return () =>
    window.removeEventListener("ordersUpdated", loadOrders);
}, [navigate]);


console.log("Vendor Orders:", orders);
  const updateStatus = (id, status) => {
  const allOrders =
    JSON.parse(localStorage.getItem("orders")) || [];

  // Marking an order Ready is what hands it off to riders, so this is
  // where the vendor sets what the rider gets paid for delivering it.
  let riderEarnings;
  if (status === "Ready") {
    const currentOrder = allOrders.find((order) => order.id === id);
    const input = prompt(
      "Set the delivery fee for the rider (₦):",
      currentOrder?.riderEarnings || ""
    );

    if (input === null) return; // vendor cancelled — don't change status

    const fee = Number(input);
    if (!input.trim() || Number.isNaN(fee) || fee <= 0) {
      toast.error("Please enter a valid delivery fee.");
      return;
    }

    riderEarnings = fee;
  }

  const updatedOrders = allOrders.map((order) =>
    order.id === id
      ? {
          ...order,
          status,
          ...(riderEarnings !== undefined && { riderEarnings }),
        }
      : order
  );

  // Save the updated orders so the rider can see them too.
  localStorage.setItem(
    "orders",
    JSON.stringify(updatedOrders)
  );

  // Update the vendor's order list immediately.
  setOrders(
    updatedOrders.filter(
      (order) =>
        String(order.vendorId) === String(vendor?.id)
    )
  );

  // Tell other pages/components that the orders have changed.
  window.dispatchEvent(new Event("ordersUpdated"));

  // Give the vendor feedback.
  if (status === "Ready") {
    toast.success(
      "Order is ready! It is now available for riders."
    );
  } else {
    toast.success(`Order status changed to ${status}`);
  }
};

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 md:ml-64">

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-white shadow px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-2xl"
          >
            <FaBars />
          </button>

          <h1 className="font-bold flex items-center gap-2">
            <FaStore className="text-blue-600" />
            Orders
          </h1>
        </div>

        <div className="p-6">

          <h1 className="text-3xl font-bold mb-2">
            Restaurant Orders
          </h1>

          <p className="text-gray-500 mb-8">
            All customer orders made from your menu.
          </p>

          {orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-10 text-center">
              <FaReceipt
                className="mx-auto text-gray-400 mb-3"
                size={35}
              />

              <h2 className="text-xl font-semibold">
                No Orders Yet
              </h2>

              <p className="text-gray-500 mt-2">
                Customer orders will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">

              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <div className="flex justify-between flex-wrap gap-5">

                    <div>
                      <p className="flex items-center gap-2 font-semibold">
                        <FaUser />
                        {order.customerName}
                      </p>

                      <p className="flex items-center gap-2 text-gray-500 mt-2">
                        <FaClock />
                        {new Date(
                          order.placedAt
                        ).toLocaleString()}
                      </p>

                      <p className="flex items-center gap-2 text-green-600 font-bold mt-2">
                        <FaMoneyBillWave />
                        ₦{order.total.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateStatus(
                            order.id,
                            e.target.value
                          )
                        }
                        className="border rounded-lg px-3 py-2"
                      >
                        <option>Placed</option>
                        <option>Preparing</option>
                        <option>Ready</option>
                        <option>Cancelled</option>
                      </select>
                    </div>

                  </div>

                  <div className="mt-5 border-t pt-4">

                    <h3 className="font-bold mb-3">
                      Ordered Items
                    </h3>

                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between py-2 border-b"
                      >
                        <div>
                          <p className="font-medium">
                            {item.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>

                        <p className="font-semibold">
                          ₦
                          {(
                            item.price *
                            item.quantity
                          ).toLocaleString()}
                        </p>
                      </div>
                    ))}

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </main>
    </div>
  );
}

export default VendorOrders;