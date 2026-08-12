import { useEffect, useState } from "react";

function StatsCards() {
  const [stats, setStats] = useState({
    menu: 0,
    orders: 0,
    revenue: 0,
  });

  useEffect(() => {
  const loadStats = () => {
    const vendor =
      JSON.parse(localStorage.getItem("currentUser")) || {};

    const menus =
      JSON.parse(localStorage.getItem("menus")) || [];

    const orders =
      JSON.parse(localStorage.getItem("orders")) || [];

    const vendorMenus = menus.filter(
      (menu) =>
        menu.restaurantName === vendor.restaurantName
    );

    const vendorOrders = orders.filter(
      (order) =>
        order.restaurantName === vendor.restaurantName
    );

    const revenue = vendorOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );

    setStats({
      menu: vendorMenus.length,
      orders: vendorOrders.length,
      revenue,
    });
  };

  loadStats();

  const interval = setInterval(loadStats, 1000);

  return () => clearInterval(interval);

}, []);

  return (
    <div className="grid md:grid-cols-3 gap-6 my-8">

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-gray-500 text-xl">
          Total Menu
        </h2>

        <p className="text-5xl font-bold mt-4">
          {stats.menu}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-gray-500 text-xl">
          Orders
        </h2>

        <p className="text-5xl font-bold mt-4">
          {stats.orders}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-gray-500 text-xl">
          Revenue
        </h2>

        <p className="text-5xl font-bold mt-4">
          ₦{stats.revenue.toLocaleString()}
        </p>
      </div>

    </div>
  );
}

export default StatsCards;