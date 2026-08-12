import { useEffect, useState } from "react";

function RecentOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {

  const loadOrders = () => {

    const vendor =
      JSON.parse(localStorage.getItem("currentUser")) || {};

    const allOrders =
      JSON.parse(localStorage.getItem("orders")) || [];

    const vendorOrders = allOrders
      .filter(
        (order) =>
          order.restaurantName === vendor.restaurantName
      )
      .sort((a, b) => b.placedAt - a.placedAt)
      .slice(0, 5);

    setOrders(vendorOrders);

  };

  loadOrders();

  const interval = setInterval(loadOrders, 1000);

  return () => clearInterval(interval);

}, []);

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-8">

      <h2 className="text-2xl font-bold mb-6">
        Recent Orders
      </h2>

      {orders.length === 0 ? (
        <p className="text-gray-500">
          No recent orders available yet.
        </p>
      ) : (
        <div className="space-y-4">

          {orders.map((order) => (
            <div
              key={order.id}
              className="flex justify-between border-b pb-4"
            >
              <div>
                <h3 className="font-semibold">
                  {order.customerName}
                </h3>

                <p className="text-gray-500 text-sm">
                  {order.items.length} item
                  {order.items.length > 1 ? "s" : ""}
                </p>

                <p className="text-sm text-gray-400">
                  {new Date(
                    order.placedAt
                  ).toLocaleString()}
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold">
                  ₦{order.total.toLocaleString()}
                </p>

                <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  {order.status}
                </span>
              </div>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default RecentOrders;