import { useState, useEffect,useRef } from "react";
import { FaBars, FaStore } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import StatsCards from "../components/Statscards";
import RecentOrders from "../components/RecentOrders";

import toast from "react-hot-toast";



// The vendor's home screen after logging in. It's mostly layout: a
// sidebar for navigation, plus a header, stats cards, and recent orders
// list — each of those is its own component.
function Dashboard() {
  // Controls whether the sidebar is open on mobile (it's always open on
  // desktop widths — see the responsive classes inside Sidebar.jsx).
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendor, setVendor] = useState(null);
  const lastOrderCount = useRef(0);

  // Fetch vendor's registered restaurant name on page load
  useEffect(() => {
    const currentUser = JSON.parse(
      localStorage.getItem("currentUser")
    );

    if (currentUser) {
      setVendor(currentUser);
    }
  }, []);

  useEffect(() => {
  if (!vendor) return;

  const checkOrders = () => {
    const orders =
      JSON.parse(localStorage.getItem("orders")) || [];

    const vendorOrders = orders.filter(
      (order) =>
        order.restaurantName === vendor.restaurantName
    );

    if (
      vendorOrders.length > lastOrderCount.current &&
      lastOrderCount.current !== 0
    ) {
      const newestOrder = vendorOrders[0];

      toast.success(
        `🔔 New order from ${newestOrder.customerName}`
      );
    }

    lastOrderCount.current = vendorOrders.length;
  };

  checkOrders();

  const interval = setInterval(checkOrders, 1000);

  return () => clearInterval(interval);

}, [vendor]);

  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 md:ml-64">

        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between bg-white shadow px-4 py-3">

          <button
            onClick={() => setSidebarOpen(true)}
            className="text-2xl"
          >
            <FaBars />
          </button>

          <h1 className="font-bold text-lg flex items-center gap-2">
            <FaStore className="text-blue-600" />
            {vendor?.restaurantName || "Loading..."}
          </h1>

        </div>


        <div className="p-6">

          <DashboardHeader
            vendor={vendor}
            setVendor={setVendor}
          />

          <StatsCards />

          <RecentOrders />

        </div>

      </main>

    </div>
  );
}

export default Dashboard;