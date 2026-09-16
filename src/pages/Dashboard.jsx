import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaStore } from "react-icons/fa";
import toast from "react-hot-toast";

import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import StatsCards from "../components/Statscards";
import RecentOrders from "../components/RecentOrders";

import { supabase } from "../lib/supabase";
import { getCurrentUser, getOrders } from "../utils/supabaseStorage";

// The vendor's home screen after logging in. It's mostly layout: a
// sidebar for navigation, plus a header, stats cards, and recent orders
// list — each of those is its own component.
function Dashboard() {
  const navigate = useNavigate();
  // Controls whether the sidebar is open on mobile (it's always open on
  // desktop widths — see the responsive classes inside Sidebar.jsx).
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendor, setVendor] = useState(null);
  const lastOrderCount = useRef(0);

  // Load the logged-in vendor from Supabase, combining their `users` row
  // with their `restaurants` row (name, address, logo) so DashboardHeader
  // has everything it needs in one object.
  useEffect(() => {
    const loadVendor = async () => {
      const currentUser = await getCurrentUser();

      if (!currentUser || currentUser.role !== "vendor") {
        toast.error("Please login as a vendor.");
        navigate("/");
        return;
      }

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("vendor_id", currentUser.id)
        .single();

      setVendor({
        id: currentUser.id,
        fullName: currentUser.full_name,
        email: currentUser.email,
        restaurantName: restaurant?.name || "",
        restaurantAddress: restaurant?.address_line || "",
        restaurantImage: restaurant?.logo_url || "",
      });
    };

    loadVendor();
  }, [navigate]);

  // Polls for new orders and shows a toast when a fresh one comes in.
  useEffect(() => {
    if (!vendor) return;

    const checkOrders = async () => {
      const vendorOrders = (await getOrders({ vendorId: vendor.id })) || [];

      if (
        vendorOrders.length > lastOrderCount.current &&
        lastOrderCount.current !== 0
      ) {
        const newestOrder = vendorOrders[0];
        toast.success(`🔔 New order from ${newestOrder.customerName}`);
      }

      lastOrderCount.current = vendorOrders.length;
    };

    checkOrders();

    const interval = setInterval(checkOrders, 5000);

    return () => clearInterval(interval);
  }, [vendor]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 md:ml-64">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between bg-white shadow px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="text-2xl">
            <FaBars />
          </button>

          <h1 className="font-bold text-lg flex items-center gap-2">
            <FaStore className="text-blue-600" />
            {vendor?.restaurantName || "Loading..."}
          </h1>
        </div>

        <div className="p-6">
          <DashboardHeader vendor={vendor} setVendor={setVendor} />

          <StatsCards />

          <RecentOrders />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;