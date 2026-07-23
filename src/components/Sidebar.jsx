import { NavLink } from "react-router-dom";
import { FaTimes } from "react-icons/fa";

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  return (
    <>
      {/* Mobile Overlay */}
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
              to="/orders"
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

          <li>
            
            
          </li>
        </ul>
      </aside>
    </>
  );
}

export default Sidebar;