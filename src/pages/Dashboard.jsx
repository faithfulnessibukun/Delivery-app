import { useState, useEffect } from "react";
import { FaBars, FaStore } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import StatsCards from "../components/Statscards";
import RecentOrders from "../components/RecentOrders";


function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendor, setVendor] = useState(null);

  // Fetch vendor's registered restaurant name on page load
  useEffect(() => {
    const currentUser = JSON.parse(
      localStorage.getItem("currentUser")
    );

    if (currentUser) {
      setVendor(currentUser);
    }
  }, []);

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