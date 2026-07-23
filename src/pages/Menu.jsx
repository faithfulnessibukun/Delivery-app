import {useState , useEffect} from "react";
import Sidebar from "../components/Sidebar";
import MenuHeader from "../components/MenuHeader";
import MenuForm from "../components/MenuForm";
import MenuTable from "../components/MenuTable";

function Menu() {
  const [menus, setMenus] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("menus"));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [editingMenu, setEditingMenu] = useState(null);
  const [categories, setCategories] = useState(() => {
  const saved = JSON.parse(localStorage.getItem("categories"));
  return saved || [
    "Meal",
    "Pizza",
    "Burger",
    "Drinks",
    "Desserts",
  ];
});

const [showCategoryModal, setShowCategoryModal] = useState(false);
const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    localStorage.setItem("menus", JSON.stringify(menus));
  }, [menus]);
  useEffect(() => {
  localStorage.setItem(
    "categories",
    JSON.stringify(categories)
  );
}, [categories]);
function deleteCategory(category) {
  const used = menus.some(
    (menu) => menu.category === category
  );

  if (used) {
    alert("This category is being used by a menu item.");
    return;
  }

  setCategories(
    categories.filter((item) => item !== category)
  );
}
function saveCategory() {
  if (!newCategory.trim()) {
    alert("Please enter a category name.");
    return;
  }

  if (categories.includes(newCategory)) {
    alert("Category already exists.");
    return;
  }

  setCategories([...categories, newCategory]);

  setNewCategory("");
  setShowCategoryModal(false);
}
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6">
        <MenuHeader
  categories={categories}
  deleteCategory={deleteCategory}
  setShowCategoryModal={setShowCategoryModal}
/>
        <MenuForm
  menus={menus}
  setMenus={setMenus}
  editingMenu={editingMenu}
  setEditingMenu={setEditingMenu}
  categories={categories}
/>
        <MenuTable menus={menus} setMenus={setMenus} editingMenu={editingMenu} setEditingMenu={setEditingMenu} />
        {showCategoryModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-80 rounded-xl p-6 shadow-xl">

      <h2 className="text-xl font-bold mb-4">
        Add Category
      </h2>

      <input
        type="text"
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
        placeholder="Category name"
        className="w-full border rounded-lg px-4 py-2 mb-4"
      />

      <div className="flex justify-end gap-3">

        <button
          onClick={() => {
            setShowCategoryModal(false);
            setNewCategory("");
          }}
          className="px-4 py-2 rounded-lg bg-gray-200"
        >
          Cancel
        </button>

        <button
          onClick={saveCategory}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Save
        </button>

      </div>

    </div>
  </div>
)}
      </main>
    </div>
  );
}

export default Menu;