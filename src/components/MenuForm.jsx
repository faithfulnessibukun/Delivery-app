
import { useState, useEffect } from "react";

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

  useEffect(() => {
    if (editingMenu) {
      setFoodName(editingMenu.foodName);
      setCategory(editingMenu.category);
      setPrice(editingMenu.price);
      setImage(editingMenu.image);
    }
  }, [editingMenu]);

  const handleAddMenu = () => {
    if (!foodName || !category || !price) {
      alert("Please fill all fields");
      return;
    }

    if (editingMenu) {
      const updatedMenus = menus.map((menu) =>
        menu.id === editingMenu.id
          ? { ...menu, foodName, category, price, image }
          : menu
      );

      setMenus(updatedMenus);
      setEditingMenu(null);
    } else {
      const newMenu = {
        id: Date.now(),
        foodName,
        category,
        price,
        image,
      };

      setMenus([...menus, newMenu]);
    }

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
          <input
            id="foodImage"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];

              if (!file) return;
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
