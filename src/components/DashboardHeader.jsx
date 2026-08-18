import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CURRENT_USER_KEYS } from "../utils/storage";

function DashboardHeader({ vendor, setVendor }) {

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const updatedVendor = {
        ...vendor,
        restaurantImage: reader.result,
      };

      setVendor(updatedVendor);

      localStorage.setItem(
        CURRENT_USER_KEYS.vendor,
        JSON.stringify(updatedVendor)
      );
    };

    reader.readAsDataURL(file);
  };


  return (
    <div className="mb-8">

      <div className="flex justify-between items-start">

        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-5">


          {/* Restaurant Picture */}
          <div className="relative">

            <img
              src={
                vendor?.restaurantImage ||
                "https://via.placeholder.com/100"
              }
              alt="Restaurant"
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
            />


            {/* Edit opens upload */}
            <label
              className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-full cursor-pointer"
            >
              Edit

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageUpload}
              />

            </label>

          </div>



          <div>

            <h2 className="text-2xl font-bold">
              {vendor?.restaurantName || "Restaurant Name"}
            </h2>


            <p className="text-gray-500">
              Owner: {vendor?.fullName}
            </p>


            <p className="text-gray-500">
              {vendor?.email}
            </p>


            <p className="text-gray-500">
              📍 {vendor?.restaurantAddress}
            </p>


            <span className="inline-block mt-3 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
              ✅ Verified Vendor
            </span>

          </div>

        </div>



        <button
          onClick={() => navigate("/menu")}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
        >
          Add Menu
        </button>


      </div>



      <div className="mt-6">

        <h1 className="text-3xl font-bold">
          Welcome Back, {vendor?.restaurantName} 👋
        </h1>


        <p className="text-gray-500 mt-2">
          Manage your restaurant efficiently from one place.
        </p>

      </div>


    </div>
  );
}

export default DashboardHeader;