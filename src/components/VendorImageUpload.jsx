import { useState } from "react";
import toast from "react-hot-toast";
import { CURRENT_USER_KEYS } from "../utils/storage";

// Lets a vendor upload a picture for their restaurant. Can be used two
// ways: with a `vendor`/`setVendor` passed in from a parent page (like
// Dashboard), or standalone at its own route — if no props are passed,
// it falls back to reading/writing the logged-in user directly.
function VendorImageUpload({ vendor: vendorProp, setVendor: setVendorProp }) {
  const [vendor, setVendor] = useState(
    () => vendorProp || JSON.parse(localStorage.getItem(CURRENT_USER_KEYS.vendor)) || null
  );
  const [preview, setPreview] = useState(vendor?.restaurantImage || "");

  // Reads the chosen image file and turns it into a base64 "data URL"
  // (see the similar comment in MenuForm.jsx) so it can be saved directly
  // in localStorage and shown with a plain <img src="...">.
  const handleUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = reader.result;

      const updatedVendor = {
        ...vendor,
        restaurantImage: image,
      };

      // Update React state — local, and the parent's if one was passed in
      setVendor(updatedVendor);
      setVendorProp?.(updatedVendor);

      // Update localStorage
      localStorage.setItem(CURRENT_USER_KEYS.vendor, JSON.stringify(updatedVendor));

      // Update preview
      setPreview(image);

      toast.success("Picture uploaded!");
    };

    reader.onerror = () => toast.error("Couldn't read that file. Try again.");

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