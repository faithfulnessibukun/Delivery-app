import { NavLink } from "react-router-dom";
import { FaHome, FaReceipt, FaUserCircle } from "react-icons/fa";

// The bottom tab bar shown on every customer-facing page (Home, Orders,
// Account). It's "fixed", meaning it stays pinned to the bottom of the
// screen even while the page above it scrolls.
function CustomerNav() {
  // NavLink (unlike a plain Link) tells us via `isActive` whether its
  // route is the one currently open, so we can highlight that tab.
  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition ${
      isActive ? "text-[#E8491D]" : "text-[#A8A096] hover:text-[#5A5448]"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#EDE4D3] shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
      <div className="max-w-3xl mx-auto flex items-center justify-around px-6 py-2">
        <NavLink to="/customer-home" className={linkClass}>
          <FaHome size={18} />
          <span className="text-xs font-bold">Home</span>
        </NavLink>

        <NavLink to="/orders" className={linkClass}>
          <FaReceipt size={18} />
          <span className="text-xs font-bold">Orders</span>
        </NavLink>

        <NavLink to="/account" className={linkClass}>
          <FaUserCircle size={18} />
          <span className="text-xs font-bold">Account</span>
        </NavLink>
      </div>
    </nav>
  );
}

export default CustomerNav;
