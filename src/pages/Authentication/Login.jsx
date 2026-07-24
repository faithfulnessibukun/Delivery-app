import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    (user) =>
      user.email === email &&
      user.password === password
  );

  if (!user) {
    alert("Invalid email or password.");
    return;
  }

  localStorage.setItem(
    "currentUser",
    JSON.stringify(user)
  );

  alert("Login successful!");

  if (user.role === "vendor") {
    navigate("/dashboard");
  } else {
    navigate("/CustomerHome");
  }
};

  const toggleForm = () => {
    setIsLogin((prev) => !prev);
  };
   const handleRegister = (e) => {
  e.preventDefault();

  if (!fullName || !email || !phone || !password || !confirmPassword) {
    alert("Please fill in all required fields.");
    return;
  }
  if (
  role === "vendor" &&
  (!restaurantName || !restaurantAddress)
) {
  alert("Please enter your restaurant details.");
  return;
}
  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];

  const existingUser = users.find(
    (user) => user.email === email
  );

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
    restaurantName:
      role === "vendor" ? restaurantName : "",
    restaurantAddress:
      role === "vendor" ? restaurantAddress : "",
  };

  users.push(newUser);

  localStorage.setItem("users", JSON.stringify(users));

  alert("Registration successful!");

  setIsLogin(true);
};
  return (
    <div className="bg-gray-500 flex items-center justify-center min-h-screen">

      <div className="bg-white shadow-lg rounded-lg px-8 py-10 mx-4 my-4 w-full max-w-md">

        <h1 className="text-3xl font-bold text-center mb-6">
          {isLogin ? " Login" : " Register"}
        </h1>

        {/* Login Form */}

        {isLogin && (
          <form onSubmit={handleSubmit}>

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
          >
            Login
          </button>

        </form>
        )}

        {/* Register Form */}
        {!isLogin && (
          <form onSubmit={handleRegister}>
        
          <div className="mb-4">
  <label className="block mb-2 font-medium">
    Full Name
  </label>

  <input
    type="text"
    placeholder="Full Name"
    value={fullName}
    onChange={(e)=> setFullName(e.target.value)}
    className="w-full border rounded-lg p-3"
  />
</div>

<div className="mb-4">
  <label className="block mb-2 font-medium">
    Register As
  </label>

  <select
    value={role}
    onChange={(e) => setRole(e.target.value)}
    className="w-full border rounded-lg p-3"
  >
    <option value="customer">Customer</option>
    <option value="vendor">Vendor</option>
  </select>
</div>

{role === "vendor" && (
  <>
    <div className="mb-4">
      <label className="block mb-2 font-medium">
        Restaurant Name
      </label>

      <input
        type="text"
        placeholder="Restaurant Name"
        value={restaurantName}
        onChange={(e) => setRestaurantName(e.target.value)}
        className="w-full border rounded-lg p-3"
      />
    </div>

    <div className="mb-4">
      <label className="block mb-2 font-medium">
        Restaurant Address
      </label>

      <input
  type="text"
  placeholder="Restaurant Address"
  value={restaurantAddress}
  onChange={(e) => setRestaurantAddress(e.target.value)}
  className="w-full border rounded-lg p-3"
/>
    </div>
  </>
)}

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Email
            </label>

            <input
  type="email"
  placeholder="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full border rounded-lg p-3"
/>
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Phone Number
            </label>

            <input
  type="tel"
  placeholder="Phone Number"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
  className="w-full border rounded-lg p-3"
/>
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Password
            </label>

            <input
  type="password"
  placeholder="Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full border rounded-lg p-3"
/>
          </div>
          
          <div className="mb-4">
  <label className="block mb-2 font-medium">
    Confirm Password
  </label>

  <input
    type="password"
    placeholder="Confirm Password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    className="w-full border rounded-lg p-3"
  />
</div>
          

          <button
            type="submit"
            className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
          >
            Register
          </button>

        </form>
        )}
        <p
          id="message"
          className="text-center mt-4"
        ></p>

        <div className="text-center mt-6">

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-medium"
          >
            {isLogin ? "Don't have an account?" : "Already have an account?"}

            <span className="hover:underline ml-1">
                {isLogin ? "Register" : "Login"}
            </span>

          </button>

        </div>

      </div>

    </div>
  );
}

export default Login;