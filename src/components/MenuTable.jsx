import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";

// Lists every menu item in a table with Edit/Delete buttons. "Edit" hands
// the clicked item to MenuForm.jsx via setEditingMenu (they share the same
// `menus` list, passed down from Menu.jsx). "Delete" removes it from
// Supabase, then updates local state to match.
function MenuTable({ menus, setMenus, setEditingMenu }) {
  const handleDelete = async (menu) => {
    const menuItemId = menu.menu_item_id || menu.id;

    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("menu_item_id", menuItemId);

    if (error) {
      toast.error("Couldn't delete item: " + error.message);
      return;
    }

    const updatedMenus = menus.filter(
      (m) => (m.menu_item_id || m.id) !== menuItemId
    );

    setMenus(updatedMenus);
    toast.success("Menu item deleted");
  };

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {menus.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No menu items yet.
                </td>
              </tr>
            ) : (
              menus.map((menu) => (
                <tr key={menu.menu_item_id || menu.id} className="border-t">
                  <td className="p-4">
                    <img
                      src={
                        menu.image ||
                        menu.image_url ||
                        "https://via.placeholder.com/70"
                      }
                      alt={menu.foodName || menu.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  </td>

                  <td>{menu.foodName || menu.name}</td>

                  <td>{menu.category}</td>

                  <td>₦{menu.price}</td>

                  <td>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm whitespace-nowrap">
                      Available
                    </span>
                  </td>

                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingMenu(menu)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition duration-300"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(menu)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition duration-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MenuTable;