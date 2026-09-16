import { NavLink, useNavigate } from "react-router-dom";
import { FaTimes, FaSignOutAlt } from "react-icons/fa";
import { supabase } from "../lib/supabase";

// The vendor-side navigation sidebar (Dashboard, Menu, Orders). On desktop
// it's always visible; on mobile it slides in/out and `sidebarOpen` +
// `setSidebarOpen` (passed down from the parent page) control that.
function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      {/* Dark overlay behind the sidebar on mobile — tapping it closes
          the sidebar, same as the X button. Hidden on desktop (md:hidden)
          since the sidebar doesn't overlay content there. */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen w-64
          bg-gray-900 text-white p-6
          transform transition-transform duration-300 z-50
          ${
            sidebarOpen
              ? "translate-x-0"
              /* md:translate-x-0 keeps it visible on desktop regardless
                 of sidebarOpen — the slide-in/out behavior is mobile-only. */
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        {/* Close button (mobile only) */}
        <div className="flex justify-between items-center mb-8 md:block">
          <h2 className="text-2xl font-bold">Vendor Panel</h2>

          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes size={22} />
          </button>
        </div>

        <ul className="space-y-3">
          <li>
            <NavLink
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `block p-2 rounded hover:bg-gray-800 ${
                  isActive ? "bg-gray-800" : ""
                }`
              }
            >
              Dashboard
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/menu"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `block p-2 rounded hover:bg-gray-800 ${
                  isActive ? "bg-gray-800" : ""
                }`
              }
            >
              Menu
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/vendor-orders"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `block p-2 rounded hover:bg-gray-800 ${
                  isActive ? "bg-gray-800" : ""
                }`
              }
            >
              Orders
            </NavLink>
          </li>

          <li className="pt-6">
            <button
              onClick={handleLogout}
              className="w-full text-left p-2 rounded hover:bg-red-600 text-red-400 hover:text-white transition"
            >
              <FaSignOutAlt className="inline mr-2" />
              Logout
            </button>
          </li>
        </ul>
      </aside>
    </>
  );
}

export default Sidebar;