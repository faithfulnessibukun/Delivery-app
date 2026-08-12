import { useEffect, useState } from "react";
import {
  FaBars,
  FaStore,
  FaReceipt,
  FaUser,
  FaClock,
  FaMoneyBillWave,
} from "react-icons/fa";

import Sidebar from "../components/Sidebar";

function VendorOrders() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const currentVendor = JSON.parse(
      localStorage.getItem("currentUser")
    );

    setVendor(currentVendor);

    const savedOrders =
      JSON.parse(localStorage.getItem("orders")) || [];

    const vendorOrders = savedOrders.filter(
      (order) => order.restaurantName=== currentVendor?.restaurantName
    );

    setOrders(vendorOrders);
  }, []);

  const updateStatus = (id, status) => {
    const allOrders =
      JSON.parse(localStorage.getItem("orders")) || [];

    const updatedOrders = allOrders.map((order) =>
      order.id === id
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

    setOrders(
      updatedOrders.filter(
        (order) => order.restaurantName === vendor?.restaurantName
      )
    );
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
                        <option>Out for Delivery</option>
                        <option>Delivered</option>
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