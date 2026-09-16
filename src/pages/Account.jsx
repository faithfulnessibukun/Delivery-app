import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaEnvelope, FaPhone, FaSignOutAlt, FaArrowLeft } from "react-icons/fa";
import toast from "react-hot-toast";
import CustomerNav from "../components/CustomerNav";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../utils/supabaseStorage";

// Shows the logged-in user's basic info and a logout button. Works for
// whichever role is actually signed in (customer/vendor/rider).
function Account() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out.");
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF6EE] pb-24">
      <div className="bg-[#1F1B16] text-white px-6 md:px-10 lg:px-16 py-6 rounded-b-[2.5rem] shadow-lg relative">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 bg-white/10 rounded-full p-2.5 hover:bg-white/20 transition"
        >
          <FaArrowLeft size={14} />
        </button>
        <h1
          className="text-3xl font-black tracking-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Account
        </h1>
      </div>

      <div className="px-6 md:px-10 lg:px-16 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow p-6 flex flex-col items-center text-center">
          <FaUserCircle className="text-[#D8CDB6]" size={72} />
          <h2 className="font-black text-xl mt-3 text-[#1F1B16]">
            {currentUser?.full_name || "Guest"}
          </h2>
          <p className="text-sm text-[#8A8378] capitalize">
            {currentUser?.role || "Not logged in"}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow p-6 mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <FaEnvelope className="text-[#E8491D] shrink-0" />
            <div>
              <p className="text-xs text-[#8A8378] uppercase tracking-wide font-bold">Email</p>
              <p className="font-medium text-[#1F1B16]">
                {currentUser?.email || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FaPhone className="text-[#3B6255] shrink-0" />
            <div>
              <p className="text-xs text-[#8A8378] uppercase tracking-wide font-bold">Phone</p>
              <p className="font-medium text-[#1F1B16]">
                {currentUser?.phone || "—"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 w-full bg-white text-[#E8491D] border-2 border-[#E8491D] py-3.5 rounded-2xl font-bold hover:bg-[#FCE7DD] transition flex items-center justify-center gap-2"
        >
          <FaSignOutAlt />
          Log out
        </button>
      </div>

      <CustomerNav />
    </div>
  );
}

export default Account;
