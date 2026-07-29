import { useNavigate } from "react-router-dom";
import { FaPepperHot, FaArrowLeft } from "react-icons/fa";

// Shown for any URL that doesn't match a real route (see the "*" route
// in App.jsx). Just a friendly message with a button back to Login/home.
function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#1F1B16] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #F4B740 1.5px, transparent 1.5px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative w-full max-w-md text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#E8491D] flex items-center justify-center shadow-[0_8px_0_0_#A8300F] -rotate-3">
          <FaPepperHot className="text-[#FBF6EE]" size={26} />
        </div>

        <h1
          className="text-7xl font-black text-[#FBF6EE] mt-6 tracking-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          404
        </h1>
        <p className="text-[#C9C2B4] mt-2">
          This page isn't on the menu.
        </p>

        <button
          onClick={() => navigate("/")}
          className="mt-8 inline-flex items-center gap-2 bg-[#E8491D] text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-[#C73A15] transition shadow-[0_6px_0_0_#A8300F] active:shadow-none active:translate-y-1.5"
        >
          <FaArrowLeft size={14} />
          Back home
        </button>
      </div>
    </div>
  );
}

export default NotFound;
