import { useState } from "react";

function Login() {
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const toggleForm = () => {
    setIsLogin((prev) => !prev);
  };

  return (
    <div className="bg-gray-500 flex items-center justify-center min-h-screen">

      <div className="bg-white shadow-lg rounded-lg px-8 py-10 mx-4 my-4 w-full max-w-md">

        <h1 className="text-3xl font-bold text-center mb-6">
          {isLogin ? "Vendor Login" : "Vendor Register"}
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
              id="loginEmail"
              placeholder="Enter email"
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Password
            </label>

            <input
              type="password"
              id="loginPassword"
              placeholder="Enter password"
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
          <form onSubmit={handleSubmit}>
        
          

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Vendor Name
            </label>

            <input
              type="text"
              id="vendorName"
              placeholder="Vendor Name"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Restaurant Name
            </label>

            <input
              type="text"
              id="businessName"
              placeholder="Restaurant Name"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Restaurant Address
            </label>

            <input
              type="text"
              id="businessAddress"
              placeholder="Restaurant Address"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Email
            </label>

            <input
              type="email"
              id="registerEmail"
              placeholder="Email"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Phone Number
            </label>

            <input
              type="tel"
              id="phone"
              placeholder="Phone Number"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Password
            </label>

            <input
              type="password"
              id="registerPassword"
              placeholder="Password"
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