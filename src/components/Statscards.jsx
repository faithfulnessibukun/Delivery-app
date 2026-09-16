import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getCurrentUser, getOrders } from "../utils/supabaseStorage";

function StatsCards() {
  const [stats, setStats] = useState({
    menu: 0,
    orders: 0,
    revenue: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      const vendor = await getCurrentUser();
      if (!vendor || vendor.role !== "vendor") return;

      // Find this vendor's restaurant, since menu_items are linked by
      // restaurant_id, not directly by vendor_id.
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("restaurant_id")
        .eq("vendor_id", vendor.id)
        .single();

      let menuCount = 0;
      if (restaurant) {
        const { count } = await supabase
          .from("menu_items")
          .select("*", { count: "exact", head: true })
          .eq("restaurant_id", restaurant.restaurant_id);
        menuCount = count || 0;
      }

      const vendorOrders = (await getOrders({ vendorId: vendor.id })) || [];

      const revenue = vendorOrders.reduce(
        (sum, order) => sum + (order.total || 0),
        0
      );

      setStats({
        menu: menuCount,
        orders: vendorOrders.length,
        revenue,
      });
    };

    loadStats();

    // Refresh periodically so new orders/menu items reflect without a
    // manual page reload.
    const interval = setInterval(loadStats, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid md:grid-cols-3 gap-6 my-8">
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-gray-500 text-xl">Total Menu</h2>
        <p className="text-5xl font-bold mt-4">{stats.menu}</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-gray-500 text-xl">Orders</h2>
        <p className="text-5xl font-bold mt-4">{stats.orders}</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-gray-500 text-xl">Revenue</h2>
        <p className="text-5xl font-bold mt-4">
          ₦{stats.revenue.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default StatsCards;