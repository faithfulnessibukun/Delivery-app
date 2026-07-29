
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

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

  // When "Edit" is clicked on an item in MenuTable, editingMenu gets set
  // to that item — this fills the form fields with its current values.
  useEffect(() => {
    if (editingMenu) {
      setFoodName(editingMenu.foodName);
      setCategory(editingMenu.category);
      setPrice(editingMenu.price);
      setImage(editingMenu.image);
    }
  }, [editingMenu]);

  // Runs when "Add Menu" / "Update Menu" is clicked.
  const handleAddMenu = () => {
    if (!foodName || !category || !price) {
      toast.error("Please fill all fields");
      return;
    }
    const currentUser = JSON.parse(
  localStorage.getItem("currentUser")
);

if (!currentUser) {
  toast.error("Please log in first.");
  return;
}

    if (editingMenu) {
      // Editing: find that item by id and replace its fields, leave
      // every other item in the list untouched.
      const updatedMenus = menus.map((menu) =>
        menu.id === editingMenu.id
          ? {
    ...menu,
    foodName,
    category,
    price,
    image,
  }
          : menu
      );

      setMenus(updatedMenus);
      setEditingMenu(null);
    } else {
      // Adding: build a brand-new menu item. Restaurant details (name,
      // address) come from the logged-in vendor's account, so every item
      // they add is automatically tagged with their restaurant info.
      const newMenu = {
  id: Date.now(),

  vendorId: currentUser.id,

  vendorName: currentUser.fullName,

  restaurantName: currentUser.restaurantName,

  restaurantAddress: currentUser.restaurantAddress,

  foodName,

  category,

  price,

  image,
};

      setMenus([...menus, newMenu]);
    }

    // Clear the form for the next item, whether we just added or edited.
    setFoodName("");
    setCategory("");
    setPrice("");
    setImage("");
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
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
              // base64 text string (a "data URL") we can store directly
              // in localStorage and use as an <img src="..."> — no server
              // upload needed since this app has no backend.
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
        className="mt-5 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        {editingMenu ? "Update Menu" : "+ Add Menu"}
      </button>
    </div>
  );
}

export default MenuForm;
