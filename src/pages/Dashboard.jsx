import { useState } from "react";
import { FaBars } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import StatsCards from "../components/Statscards";
import RecentOrders from "../components/RecentOrders";

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1">

        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between bg-white shadow px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-2xl"
          >
            <FaBars />
          </button>

          <h1 className="font-bold text-lg">
            Vendor Panel
          </h1>
        </div>

        <div className="p-6">
          <DashboardHeader />

          <StatsCards />

          <RecentOrders />
        </div>

      </main>

    </div>
  );
}

export default Dashboard;