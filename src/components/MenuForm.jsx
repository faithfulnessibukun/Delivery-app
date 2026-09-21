import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { getCurrentUser, getVendorDetails } from "../utils/supabaseStorage";

// A form for adding a new menu item, that also doubles as the edit form.
// Which mode it's in depends on `editingMenu`: null means "adding new",
// otherwise it's pre-filled with that item's details for editing.
// `menus`/`setMenus` are passed down from Menu.jsx so this form can update
// the same list that MenuTable.jsx displays.
function MenuForm({
  menus,
  setMenus,
  editingMenu,
  setEditingMenu,
  categories,
}) {
  const [foodName, setFoodName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);

  // When "Edit" is clicked on an item in MenuTable, editingMenu gets set
  // to that item — this fills the form fields with its current values.
  useEffect(() => {
    if (editingMenu) {
      setFoodName(editingMenu.foodName || editingMenu.name);
      setCategory(editingMenu.category);
      setPrice(editingMenu.price);
      setImage(editingMenu.image || editingMenu.image_url || "");
    }
  }, [editingMenu]);

  // Runs when "Add Menu" / "Update Menu" is clicked.
  const handleAddMenu = async () => {
    if (!foodName || !category || !price) {
      toast.error("Please fill all fields");
      return;
    }

    setSaving(true);

    try {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        toast.error("Please log in first.");
        setSaving(false);
        return;
      }

      if (currentUser.role !== "vendor") {
        toast.error("Only vendor accounts can add menu items.");
        setSaving(false);
        return;
      }

      // Get vendor details from the vendors table
      const vendorDetails = await getVendorDetails(currentUser.id);

      if (!vendorDetails?.business_name) {
        toast.error(
          "Your vendor account has no restaurant name on file, so this item won't be visible to customers. Please re-register with a restaurant name."
        );
        setSaving(false);
        return;
      }

      // Look up this vendor's restaurant row — menu_items needs a
      // restaurant_id, not a vendor_id, to satisfy the schema's foreign key.
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("restaurant_id")
        .eq("vendor_id", currentUser.id)
        .single();

      if (restaurantError || !restaurant) {
        toast.error("Couldn't find your restaurant. Please contact support.");
        setSaving(false);
        return;
      }

      if (editingMenu) {
        // Editing: update the existing row in Supabase, then reflect the
        // same change in local state so the table re-renders instantly.
        const menuItemId = editingMenu.menu_item_id || editingMenu.id;

        const { error: updateError } = await supabase
          .from("menu_items")
          .update({
            name: foodName,
            category,
            price: parseFloat(price),
            image_url: image,
          })
          .eq("menu_item_id", menuItemId);

        if (updateError) {
          toast.error(updateError.message);
          setSaving(false);
          return;
        }

        const updatedMenus = menus.map((menu) =>
          (menu.menu_item_id || menu.id) === menuItemId
            ? {
                ...menu,
                foodName,
                name: foodName,
                itemName: foodName,
                category,
                price,
                image,
                itemImage: image,
                image_url: image,
              }
            : menu
        );

        setMenus(updatedMenus);
        setEditingMenu(null);
      } else {
        // Adding: insert a new row into Supabase, then use the row it
        // hands back (which includes the real menu_item_id) for local state.
        const { data: inserted, error: insertError } = await supabase
          .from("menu_items")
          .insert({
            restaurant_id: restaurant.restaurant_id,
            name: foodName,
            category,
            price: parseFloat(price),
            image_url: image,
            is_available: true,
          })
          .select()
          .single();

        if (insertError) {
          toast.error(insertError.message);
          setSaving(false);
          return;
        }

        const newMenu = {
          id: inserted.menu_item_id,
          menu_item_id: inserted.menu_item_id,

          vendorId: currentUser.id,
          vendorName: currentUser.full_name,

          restaurantName: vendorDetails.business_name,
          restaurantAddress: vendorDetails.restaurant_address,

          foodName,
          name: foodName,
          itemName: foodName,

          category,
          price,

          image,
          itemImage: image,
          image_url: image,
        };

        setMenus([...menus, newMenu]);
      }

      // Clear the form for the next item, whether we just added or edited.
      setFoodName("");
      setCategory("");
      setPrice("");
      setImage("");
    } catch (error) {
      console.error("Error adding menu item:", error);
      toast.error("Failed to add menu item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="add-menu-form" className="bg-white rounded-xl shadow p-6 mb-6 scroll-mt-4">
      <h2 className="text-xl font-bold mb-4">Add New Menu Item</h2>

      <div className="grid md:grid-cols-2 gap-4 items-start">
        <input
          type="text"
          placeholder="Food Name"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          className="border rounded-lg px-4 py-2"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">Select Category</option>

          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border rounded-lg px-4 py-2 self-start"
        />

        <div>
          {/* This file input is visually hidden — the styled "Choose File"
              label below is what the user actually clicks (its htmlFor
              points at this input's id, which opens the file picker). */}
          <input
            id="foodImage"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];

              if (!file) return;
              // FileReader converts the chosen image file into a long
              // base64 text string (a "data URL") we store directly in the
              // database and use as an <img src="..."> — see the note in
              // chat about moving this to Supabase Storage later.
              const reader = new FileReader();

              reader.onloadend = () => {
                setImage(reader.result);
              };

              reader.readAsDataURL(file);
            }}
          />

          <label
            htmlFor="foodImage"
            className="cursor-pointer bg-gray-200 hover:bg-gray-300 border rounded-lg px-4 py-2 inline-block"
          >
            📷 Choose File
          </label>

          {image && (
            <img
              src={image}
              alt="Preview"
              className="w-32 h-32 mt-3 rounded-lg object-cover border"
            />
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddMenu}
        disabled={saving}
        className="mt-5 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : editingMenu ? "Update Menu" : "+ Add Menu"}
      </button>
    </div>
  );
}

export default MenuForm;