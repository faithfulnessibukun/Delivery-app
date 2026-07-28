import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaStore, FaPepperHot } from "react-icons/fa";

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("customer");
  const [fullName, setFullName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const user = users.find(
      (user) => user.email === email && user.password === password
    );

    if (!user) {
      alert("Invalid email or password.");
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(user));

    alert("Login successful!");

    if (user.role === "vendor") {
      navigate("/dashboard");
    } else {
      navigate("/CustomerHome");
    }
  };

  const switchTo = (loginMode) => {
    setIsLogin(loginMode);
  };

  const handleRegister = (e) => {
    e.preventDefault();

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      alert("Please fill in all required fields.");
      return;
    }
    if (role === "vendor" && (!restaurantName || !restaurantAddress)) {
      alert("Please enter your restaurant details.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const existingUser = users.find((user) => user.email === email);

    if (existingUser) {
      alert("An account with this email already exists.");
      return;
    }

    const newUser = {
      id: Date.now(),
      fullName,
      email,
      phone,
      password,
      role,
      restaurantName: role === "vendor" ? restaurantName : "",
      restaurantAddress: role === "vendor" ? restaurantAddress : "",
    };

    users.push(newUser);

    localStorage.setItem("users", JSON.stringify(users));

    alert("Registration successful! You can now log in.");

    setIsLogin(true);
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
          <div className="w-16 h-16 rounded-2xl bg-[#E8491D] flex items-center justify-center shadow-[0_8px_0_0_#A8300F] rotate-3">
            <FaPepperHot className="text-[#FBF6EE]" size={26} />
          </div>
          <h1
            className="text-4xl font-black text-[#FBF6EE] mt-5 tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Chop<span className="text-[#F4B740]">Chop</span>
          </h1>
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
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#E8491D] text-white p-3.5 rounded-2xl hover:bg-[#C73A15] transition font-bold shadow-[0_6px_0_0_#A8300F] active:shadow-none active:translate-y-1.5"
              >
                Login
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
                <div className="grid grid-cols-2 gap-3">
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
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#E8491D] text-white p-3.5 rounded-2xl hover:bg-[#C73A15] transition font-bold shadow-[0_6px_0_0_#A8300F] active:shadow-none active:translate-y-1.5"
              >
                Register
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