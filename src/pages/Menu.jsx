import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaBars, FaStore } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import MenuHeader from "../components/MenuHeader";
import MenuForm from "../components/MenuForm";
import MenuTable from "../components/MenuTable";
import {
  getMenus,
  getCategories,
  addCategory,
  deleteCategoryByName,
  getCurrentUser,
  getVendorDetails,
} from "../utils/supabaseStorage";

// The vendor's menu management screen: add/edit/delete menu items
// (handled by MenuForm + MenuTable, which each save directly to Supabase
// per-action) and manage categories (handled here, with a small popup
// for adding a new one).
function Menu() {
  // Controls the mobile hamburger sidebar (see Sidebar.jsx).
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // The vendor's saved menu items, loaded from Supabase on first render.
  const [menus, setMenus] = useState([]);
  // Which menu item (if any) is currently being edited in MenuForm.
  const [editingMenu, setEditingMenu] = useState(null);
  // Category list, with a few defaults if nothing was saved before.
  const [categories, setCategories] = useState([
    "Meal",
    "Pizza",
    "Burger",
    "Drinks",
    "Desserts",
  ]);
  // Controls the "Add Category" popup.
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  // Track loading state and vendor ID
  const [isLoading, setIsLoading] = useState(true);
  const [vendorId, setVendorId] = useState(null);
  // Shown in the mobile header in place of the generic "Menu" label.
  const [restaurantName, setRestaurantName] = useState("");

  // Load menus and categories from Supabase when component mounts.
  // NOTE: menus/categories are only ever WRITTEN by their own dedicated
  // functions (MenuForm's insert/update, MenuTable's delete, addCategory/
  // deleteCategoryByName below) — never by a bulk "save the whole list"
  // effect. That pattern used to silently corrupt data; see the note on
  // the old saveMenus/saveCategories in supabaseStorage.js.
  useEffect(() => {
    const loadMenusAndCategories = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || user.role !== "vendor") {
          toast.error("You must be logged in as a vendor to manage menus.");
          setIsLoading(false);
          return;
        }
        setVendorId(user.id);

        const vendorDetails = await getVendorDetails(user.id);
        setRestaurantName(vendorDetails?.business_name || "");

        const fetchedMenus = await getMenus(user.id);
        const fetchedCategories = await getCategories(user.id);

        setMenus(fetchedMenus || []);
        if (fetchedCategories && fetchedCategories.length > 0) {
          setCategories(fetchedCategories);
        }
      } catch (error) {
        console.error("Error loading menus and categories:", error);
        toast.error("Failed to load menu data");
      } finally {
        setIsLoading(false);
      }
    };

    loadMenusAndCategories();
  }, []);

  // Removes a category — but only if no menu item is currently using it,
  // otherwise that item would be left with a category that no longer exists.
  async function deleteCategory(category) {
    const used = menus.some((menu) => menu.category === category);

    if (used) {
      toast.error("This category is being used by a menu item.");
      return;
    }

    try {
      await deleteCategoryByName(vendorId, category);
      setCategories(categories.filter((item) => item !== category));
    } catch (error) {
      toast.error("Failed to delete category.");
    }
  }

  // Adds a new category from the "Add Category" popup, after checking it's
  // not empty and not already in the list.
  async function saveCategory() {
    if (!newCategory.trim()) {
      toast.error("Please enter a category name.");
      return;
    }

    if (categories.includes(newCategory)) {
      toast.error("Category already exists.");
      return;
    }

    try {
      await addCategory(vendorId, newCategory);
      setCategories([...categories, newCategory]);
      setNewCategory("");
      setShowCategoryModal(false);
    } catch (error) {
      toast.error("Failed to add category.");
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Loading menu...</p>
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 md:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-white shadow px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="text-2xl">
            <FaBars />
          </button>

          <h1 className="font-bold flex items-center gap-2">
            <FaStore className="text-blue-600" />
            {restaurantName || "Menu"}
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
          <MenuTable
            menus={menus}
            setMenus={setMenus}
            editingMenu={editingMenu}
            setEditingMenu={setEditingMenu}
          />
          {showCategoryModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
              <div className="bg-white w-full max-w-xs sm:max-w-sm rounded-xl p-6 shadow-xl">
                <h2 className="text-xl font-bold mb-4">Add Category</h2>

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