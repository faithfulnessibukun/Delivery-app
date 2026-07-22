function MenuHeader() {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Menu Management
          </h1>

          <p className="text-gray-500 mt-2">
            Manage your restaurant.
          </p>
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add New Menu
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-4">

          <input
            type="text"
            placeholder="Search food..."
            className="border rounded-lg px-4 py-2 w-full"
          />

          <select className="border rounded-lg px-4 py-2">
            <option>All Categories</option>
            <option>Meal</option>
            <option>Pizza</option>
            <option>Burger</option>
            <option>Drinks</option>
            <option>Desserts</option>
          </select>

        </div>
      </div>
    </>
  );
}

export default MenuHeader;