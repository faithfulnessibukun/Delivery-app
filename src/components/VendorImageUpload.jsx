import { useState } from "react";

function VendorImageUpload({ vendor, setVendor }) {
  const [preview, setPreview] = useState(
    vendor?.restaurantImage || ""
  );

  const handleUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const image = reader.result;

      const updatedVendor = {
        ...vendor,
        restaurantImage: image,
      };

      // Update React state
      setVendor(updatedVendor);

      // Update localStorage
      localStorage.setItem(
        "currentUser",
        JSON.stringify(updatedVendor)
      );

      // Update preview
      setPreview(image);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center mb-6">

      <img
        src={preview || "/default-restaurant.png"}
        alt="Restaurant"
        className="w-32 h-32 rounded-full object-cover border shadow"
      />

      <label className="mt-4 bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
        Upload Picture

        <input
          type="file"
          accept="image/*"
          hidden
          onChange={handleUpload}
        />
      </label>

    </div>
  );
}

export default VendorImageUpload;