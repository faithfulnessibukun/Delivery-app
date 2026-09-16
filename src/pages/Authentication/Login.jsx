import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaUser, FaStore, FaMotorcycle, FaMapPin, FaEye, FaEyeSlash } from "react-icons/fa";
import { supabase } from "../../lib/supabase";

// This one page handles both logging in and registering a new account —
// which form shows is controlled by the `isLogin` flag below, flipped by
// the Login/Register tabs.
function Login() {
  // Not logged in on landing → open straight into the Register tab.
  const [isLogin, setIsLogin] = useState(false);
  // "customer", "vendor", or "rider" — chosen on the Register form.
  const [role, setRole] = useState("customer");
  const [fullName, setFullName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Each password field has its own show/hide toggle (the eye icon).
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Logs in against Supabase Auth, then looks up this user's role in our
  // own `users` table so we know which home screen to send them to.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Normalize so "John@Gmail.com" and "john@gmail.com " (stray space)
    // are always treated as the same account.
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      toast.error("Couldn't find your account details.");
      setLoading(false);
      return;
    }

    toast.success("Login successful!");

    if (profile.role === "vendor") {
      navigate("/dashboard");
    } else if (profile.role === "rider") {
      navigate("/rider-dashboard");
    } else {
      navigate("/customer-home");
    }

    setLoading(false);
  };

  // Switches between the Login form and the Register form.
  const switchTo = (loginMode) => {
    setIsLogin(loginMode);
  };

  // Validates the register form, creates the Supabase Auth account, then
  // creates matching rows in `users` and the role-specific table
  // (customers / vendors + restaurants / riders).
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (role === "vendor" && (!restaurantName || !restaurantAddress)) {
      toast.error("Please enter your restaurant details.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    // Normalize so a stray capital letter or leading/trailing space
    // can't slip past the "does this account already exist" check and
    // create a near-duplicate account for the same person.
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedFullName = fullName.trim();

    // Step 1: create the auth account (handles password hashing/sessions)
    const { data, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    const newUserId = data.user.id;

    // Step 2: create the shared profile row
    const { error: userError } = await supabase.from("users").insert({
      id: newUserId,
      full_name: normalizedFullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      role,
    });

    if (userError) {
      toast.error(userError.message);
      setLoading(false);
      return;
    }

    // Step 3: create the role-specific row(s)
    if (role === "customer") {
      const { error } = await supabase.from("customers").insert({
        customer_id: newUserId,
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
    }

    if (role === "vendor") {
      const { error: vendorError } = await supabase.from("vendors").insert({
        vendor_id: newUserId,
        business_name: restaurantName,
      });
      if (vendorError) {
        toast.error(vendorError.message);
        setLoading(false);
        return;
      }

      const { error: restaurantError } = await supabase.from("restaurants").insert({
        vendor_id: newUserId,
        name: restaurantName,
        address_line: restaurantAddress,
      });
      if (restaurantError) {
        toast.error(restaurantError.message);
        setLoading(false);
        return;
      }
    }

    if (role === "rider") {
      const { error } = await supabase.from("riders").insert({
        rider_id: newUserId,
        license_number: licenseNumber || null,
        vehicle_type: vehicleType || null,
        vehicle_plate: vehiclePlate || null,
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
    }

    toast.success("Registration successful! You can now log in.");
    setIsLogin(true);
    setLoading(false);
  };

  const inputClasses =
    "w-full border-2 border-[#EDE4D3] rounded-2xl p-3.5 text-[#1F1B16] placeholder:text-[#A8A096] bg-[#FBF6EE] focus:outline-none focus:ring-2 focus:ring-[#E8491D] focus:border-transparent transition font-medium";

  const labelClasses =
    "block mb-2 font-bold text-[#1F1B16] text-xs uppercase tracking-wider";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#1F1B16] relative overflow-hidden">
      {/* Ambient pepper-flake texture */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #F4B740 1.5px, transparent 1.5px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-4 mb-2">
            <h1
              className="text-4xl font-black text-[#FBF6EE] tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Check<span className="text-[#F4B740]">Out</span>
            </h1>
            <div className="w-14 h-14 rounded-2xl bg-[#E8491D] flex items-center justify-center shadow-[0_6px_0_0_#A8300F]">
              <FaMapPin className="text-[#FBF6EE]" size={24} />
            </div>
          </div>
          <p className="text-[#C9C2B4] text-sm mt-2 text-center">
            {isLogin
              ? "Sign in — your next plate is waiting"
              : "Join as a customer, or list your kitchen as a vendor"}
          </p>
        </div>

        <div className="bg-[#FBF6EE] rounded-[2rem] px-8 py-9 shadow-2xl">
          {/* Login / Register tabs */}
          <div className="flex bg-[#EDE4D3] rounded-full p-1.5 mb-7">
            <button
              type="button"
              onClick={() => switchTo(true)}
              className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all ${
                isLogin
                  ? "bg-[#1F1B16] text-[#FBF6EE] shadow"
                  : "text-[#8A8378]"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchTo(false)}
              className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all ${
                !isLogin
                  ? "bg-[#1F1B16] text-[#FBF6EE] shadow"
                  : "text-[#8A8378]"
              }`}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {isLogin && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelClasses}>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClasses} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A8A096] hover:text-[#5A5448] transition"
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E8491D] text-white p-3.5 rounded-2xl hover:bg-[#C73A15] transition font-bold shadow-[0_6px_0_0_#A8300F] active:shadow-none active:translate-y-1.5 disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          )}

          {/* Register Form */}
          {!isLogin && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className={labelClasses}>Full Name</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClasses}
                />
              </div>

              {/* Role selector */}
              <div>
                <label className={labelClasses}>Register As</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("customer")}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-3.5 transition ${
                      role === "customer"
                        ? "border-[#E8491D] bg-[#FCE7DD] text-[#E8491D]"
                        : "border-[#EDE4D3] text-[#A8A096] hover:border-[#D8CDB6]"
                    }`}
                  >
                    <FaUser />
                    <span className="text-sm font-bold">Customer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("vendor")}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-3.5 transition ${
                      role === "vendor"
                        ? "border-[#3B6255] bg-[#E3EAE6] text-[#3B6255]"
                        : "border-[#EDE4D3] text-[#A8A096] hover:border-[#D8CDB6]"
                    }`}
                  >
                    <FaStore />
                    <span className="text-sm font-bold">Vendor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("rider")}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-3.5 transition ${
                      role === "rider"
                        ? "border-[#F4B740] bg-[#FCF0D6] text-[#9C7311]"
                        : "border-[#EDE4D3] text-[#A8A096] hover:border-[#D8CDB6]"
                    }`}
                  >
                    <FaMotorcycle />
                    <span className="text-sm font-bold">Rider</span>
                  </button>
                </div>
              </div>

              {role === "vendor" && (
                <>
                  <div>
                    <label className={labelClasses}>Restaurant Name</label>
                    <input
                      type="text"
                      placeholder="Restaurant Name"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Restaurant Address</label>
                    <input
                      type="text"
                      placeholder="Restaurant Address"
                      value={restaurantAddress}
                      onChange={(e) => setRestaurantAddress(e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </>
              )}

              {role === "rider" && (
                <>
                  <div>
                    <label className={labelClasses}>License Number (optional)</label>
                    <input
                      type="text"
                      placeholder="License Number (optional)"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Vehicle Type</label>
                    <input
                      type="text"
                      placeholder="e.g. Motorcycle, Bicycle, Car"
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Vehicle Plate Number</label>
                    <input
                      type="text"
                      placeholder="Plate Number (optional)"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </>
              )}

              <div>
                <label className={labelClasses}>Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Password</label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClasses} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A8A096] hover:text-[#5A5448] transition"
                  >
                    {showRegisterPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputClasses} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A8A096] hover:text-[#5A5448] transition"
                  >
                    {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E8491D] text-white p-3.5 rounded-2xl hover:bg-[#C73A15] transition font-bold shadow-[0_6px_0_0_#A8300F] active:shadow-none active:translate-y-1.5 disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>
          )}

          <p className="text-center mt-7 text-sm text-[#8A8378]">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => switchTo(!isLogin)}
              className="text-[#E8491D] font-bold hover:underline"
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;