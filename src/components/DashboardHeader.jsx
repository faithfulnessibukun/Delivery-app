import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";

function DashboardHeader({ vendor, setVendor }) {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setUploading(true);

    const reader = new FileReader();

    reader.onload = async () => {
      const imageDataUrl = reader.result;

      // Save to Supabase — restaurants.logo_url is the field this maps to.
      const { error } = await supabase
        .from("restaurants")
        .update({ logo_url: imageDataUrl })
        .eq("vendor_id", vendor.id);

      if (error) {
        toast.error("Couldn't save your image: " + error.message);
        setUploading(false);
        return;
      }

      // Reflect the change locally so the UI updates immediately.
      const updatedVendor = {
        ...vendor,
        restaurantImage: imageDataUrl,
      };

      setVendor(updatedVendor);
      toast.success("Restaurant image updated!");
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-5 text-center sm:text-left">
          {/* Restaurant Picture */}
          <div className="relative shrink-0">
            <img
              src={
                vendor?.restaurantImage ||
                "https://via.placeholder.com/100"
              }
              alt="Restaurant"
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
            />

            {/* Edit opens upload */}
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-full cursor-pointer">
              {uploading ? "..." : "Edit"}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                disabled={uploading}
                onChange={handleImageUpload}
              />
            </label>
          </div>

          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold break-words">
              {vendor?.restaurantName || "Restaurant Name"}
            </h2>

            <p className="text-gray-500 break-words">Owner: {vendor?.fullName}</p>

            <p className="text-gray-500 break-words">{vendor?.email}</p>

            <p className="text-gray-500 break-words">
              📍 {vendor?.restaurantAddress}
            </p>

            <span className="inline-block mt-3 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
              ✅ Verified Vendor
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate("/menu")}
          className="w-full md:w-auto shrink-0 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
        >
          Add Menu
        </button>
      </div>

      <div className="mt-6">
        <h1 className="text-2xl sm:text-3xl font-bold break-words">
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