import {useState , useEffect} from "react";
import toast from "react-hot-toast";
import { FaBars, FaStore } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import MenuHeader from "../components/MenuHeader";
import MenuForm from "../components/MenuForm";
import MenuTable from "../components/MenuTable";

// The vendor's menu management screen: add/edit/delete menu items
// (handled by MenuForm + MenuTable) and manage categories (handled here,
// with a small popup/modal for adding a new one).
function Menu() {
  // Controls the mobile hamburger sidebar (see Sidebar.jsx).
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // The vendor's saved menu items, loaded from localStorage on first render.
  const [menus, setMenus] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("menus"));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  // Which menu item (if any) is currently being edited in MenuForm.
  const [editingMenu, setEditingMenu] = useState(null);
  // Category list, with a few defaults if nothing was saved before.
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

// Controls the "Add Category" popup.
const [showCategoryModal, setShowCategoryModal] = useState(false);
const [newCategory, setNewCategory] = useState("");

  // Whenever menus or categories change, save the updated list back to
  // localStorage so it's remembered after a page refresh.
  useEffect(() => {
    localStorage.setItem("menus", JSON.stringify(menus));
    // Notify other parts of the app (CustomerHome) that menus changed so
    // they can refresh without a full page reload.
    try {
      window.dispatchEvent(new Event("menusUpdated"));
    } catch {}
  }, [menus]);
  useEffect(() => {
  localStorage.setItem(
    "categories",
    JSON.stringify(categories)
  );
}, [categories]);

// Removes a category — but only if no menu item is currently using it,
// otherwise that item would be left with a category that no longer exists.
function deleteCategory(category) {
  const used = menus.some(
    (menu) => menu.category === category
  );

  if (used) {
    toast.error("This category is being used by a menu item.");
    return;
  }

  setCategories(
    categories.filter((item) => item !== category)
  );
}

// Adds a new category from the "Add Category" popup, after checking it's
// not empty and not already in the list.
function saveCategory() {
  if (!newCategory.trim()) {
    toast.error("Please enter a category name.");
    return;
  }

  if (categories.includes(newCategory)) {
    toast.error("Category already exists.");
    return;
  }

  setCategories([...categories, newCategory]);

  setNewCategory("");
  setShowCategoryModal(false);
}
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 md:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-white shadow px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-2xl"
          >
            <FaBars />
          </button>

          <h1 className="font-bold flex items-center gap-2">
            <FaStore className="text-blue-600" />
            Menu
          </h1>
        </div>

        <div className="p-6">
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
        </div>
      </main>
    </div>
  );
}

export default Menu;