import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTimes,
  FaSignOutAlt,
  FaTachometerAlt,
  FaCheckCircle,
  FaMotorcycle,
} from "react-icons/fa";
import { supabase } from "../lib/supabase";

function RiderSidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50
          h-screen w-64
          bg-[#1F1B16] text-white
          shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-[#F4B740] text-[#1F1B16] p-2.5 rounded-xl">
              <FaMotorcycle size={20} />
            </div>

            <div>
              <h2 className="text-xl font-black">Rider Panel</h2>
              <p className="text-xs text-gray-400">Delivery Center</p>
            </div>
          </div>

          {/* Mobile close */}
          <button
            onClick={closeSidebar}
            className="md:hidden text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded-lg transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 px-3 mb-3">
            Main Menu
          </p>

          <ul className="space-y-2">
            {/* Dashboard */}
            <li>
              <NavLink
                to="/rider-dashboard"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition ${
                    isActive
                      ? "bg-[#F4B740] text-[#1F1B16] shadow-md"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <FaTachometerAlt />
                <span>Dashboard</span>
              </NavLink>
            </li>

            {/* Completed Deliveries */}
            <li>
              <NavLink
                to="/rider-completed-deliveries"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition ${
                    isActive
                      ? "bg-[#F4B740] text-[#1F1B16] shadow-md"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <FaCheckCircle />
                <span>Completed Deliveries</span>
              </NavLink>
            </li>
          </ul>

          {/* Logout */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 font-semibold hover:bg-red-600 hover:text-white transition"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}

export default RiderSidebar;