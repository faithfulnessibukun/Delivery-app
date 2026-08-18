import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTimes,
  FaSignOutAlt,
  FaBoxOpen,
  FaMapMarkedAlt,
  FaTachometerAlt,
  FaUtensils,
  FaCheckCircle,
} from "react-icons/fa";

function RiderSidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">
            Rider Panel
          </h2>

          {/* Close button - mobile only */}
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes size={22} />
          </button>
        </div>

        <ul className="space-y-3">

          {/* Dashboard */}
          <li>
            <NavLink
              to="/rider-dashboard"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition ${
                  isActive ? "bg-gray-800" : ""
                }`
              }
            >
              <FaTachometerAlt />
              Dashboard
            </NavLink>
          </li>

          {/* Courier Orders */}
          <li>
            <NavLink
              to="/rider-courier-orders"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition ${
                  isActive ? "bg-gray-800" : ""
                }`
              }
            >
              <FaBoxOpen />
              Courier Orders
            </NavLink>
          </li>

          {/* Active Courier Delivery */}
          <li>
            <NavLink
              to="/rider-courier-delivery"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition ${
                  isActive ? "bg-gray-800" : ""
                }`
              }
            >
              <FaMapMarkedAlt />
              Active Courier Delivery
            </NavLink>
          </li>

          {/* Active Food Delivery */}
          <li>
            <NavLink
              to="/rider-food-delivery"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition ${
                  isActive ? "bg-gray-800" : ""
                }`
              }
            >
              <FaUtensils />
              Active Food Delivery
            </NavLink>
          </li>

          {/* Completed Deliveries */}
          <li>
            <NavLink
              to="/rider-completed-deliveries"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition ${
                  isActive ? "bg-gray-800" : ""
                }`
              }
            >
              <FaCheckCircle />
              Completed Deliveries
            </NavLink>
          </li>

          {/* Logout */}
          <li className="pt-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 text-left p-3 rounded-lg hover:bg-red-600 text-red-400 hover:text-white transition"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </li>

        </ul>
      </aside>
    </>
  );
}

export default RiderSidebar;