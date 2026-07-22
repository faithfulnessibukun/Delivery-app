function MenuTable({ menus , setMenus ,setEditingMenu }) {
  const handleDelete = (id) => {
  const updatedMenus = menus.filter((menu) => menu.id !== id);

  setMenus(updatedMenus);
};
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">

      <table className="w-full text-left">

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
      <td
        colSpan="6"
        className="text-center py-8 text-gray-500"
      >
        No menu items yet.
      </td>
    </tr>
  ) : (
    menus.map((menu) => (
      <tr key={menu.id} className="border-t">

        <td className="p-4">
          <img
            src={menu.image || "https://via.placeholder.com/70"}
            alt={menu.foodName}
            className="w-16 h-16 rounded-lg object-cover"
          />
        </td>

        <td>{menu.foodName}</td>

        <td>{menu.category}</td>

        <td>₦{menu.price}</td>

        <td>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
            Available
          </span>
        </td>

        <td>
          <div className="flex gap-2">

            <button 
            onClick={() => setEditingMenu(menu)}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition duration-300">
              Edit
            </button>

            <button 
            onClick={() => handleDelete(menu.id)}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition duration-300">
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
  );
}

export default MenuTable;