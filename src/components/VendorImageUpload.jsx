import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../utils/supabaseStorage";

// Lets a vendor upload a picture for their restaurant. Can be used two
// ways: with a `vendor`/`setVendor` passed in from a parent page (like
// Dashboard), or standalone at its own route — if no props are passed,
// it loads the logged-in vendor itself from Supabase.
function VendorImageUpload({ vendor: vendorProp, setVendor: setVendorProp }) {
  const [vendor, setVendor] = useState(vendorProp || null);
  const [preview, setPreview] = useState(vendorProp?.restaurantImage || "");
  const [uploading, setUploading] = useState(false);

  // If no vendor was passed in as a prop, load the logged-in user
  // ourselves so this component works standalone too.
  useEffect(() => {
    if (vendorProp) return;

    const loadVendor = async () => {
      const currentUser = await getCurrentUser();
      setVendor(currentUser);
      setPreview(currentUser?.restaurantImage || "");
    };

    loadVendor();
  }, [vendorProp]);

  // Reads the chosen image file, turns it into a base64 "data URL" (see
  // the similar comment in MenuForm.jsx), and saves it straight to the
  // restaurants table in Supabase.
  const handleUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    if (!vendor?.id) {
      toast.error("Couldn't find your account. Please log in again.");
      return;
    }

    setUploading(true);

    const reader = new FileReader();

    reader.onload = async () => {
      const image = reader.result;

      const { error } = await supabase
        .from("restaurants")
        .update({ logo_url: image })
        .eq("vendor_id", vendor.id);

      if (error) {
        toast.error("Couldn't save your image: " + error.message);
        setUploading(false);
        return;
      }

      const updatedVendor = { ...vendor, restaurantImage: image };

      setVendor(updatedVendor);
      setVendorProp?.(updatedVendor);
      setPreview(image);

      toast.success("Picture uploaded!");
      setUploading(false);
    };

    reader.onerror = () => {
      toast.error("Couldn't read that file. Try again.");
      setUploading(false);
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
        {uploading ? "Uploading..." : "Upload Picture"}

        <input
          type="file"
          accept="image/*"
          hidden
          disabled={uploading}
          onChange={handleUpload}
        />
      </label>
    </div>
  );
}

export default VendorImageUpload;