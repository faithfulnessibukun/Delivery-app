import { useState } from "react";
import { Outlet } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import RiderSidebar from "./RiderSidebar";

function RiderLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Sidebar */}
      <RiderSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <main className="md:ml-64 min-h-screen p-4 md:p-6">

        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden bg-gray-900 text-white p-3 rounded-xl mb-5"
        >
          <FaBars size={20} />
        </button>

        {/* Current page appears here */}
        <Outlet />

      </main>

    </div>
  );
}

export default RiderLayout;