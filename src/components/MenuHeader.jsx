import { useState } from "react";
import { FaChevronDown, FaTimes, FaPlus } from "react-icons/fa";

// The top section of the Menu page: title and an "All Categories"
// dropdown that lists every category with a delete (X) button next to
// each, plus an "Add Category" option at the bottom. "Add New Menu"
// jumps down to the add-item form below.
function MenuHeader({categories,deleteCategory,setShowCategoryModal

}){
  // Whether the categories dropdown is currently open.
  const [openDropdown, setOpenDropdown] = useState(false);

  // Scrolls down to the "Add New Menu Item" form and focuses its first
  // field, instead of duplicating that form up here.
  const scrollToAddForm = () => {
    const form = document.getElementById("add-menu-form");
    if (!form) return;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    form.querySelector("input,select")?.focus();
  };

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

        <button
          onClick={scrollToAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Menu
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-4">

            <div className="relative">

  <button
    onClick={() => setOpenDropdown(!openDropdown)}
    className="border rounded-lg px-4 py-2 bg-white flex items-center gap-3"
  >
    All Categories
    <FaChevronDown />
  </button>

  {openDropdown && (
    <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50">

      {/* All Categories */}

      <button 
       onClick={() => setOpenDropdown(false)}
      className="w-full text-left px-4 py-3 hover:bg-gray-100 font-semibold">
        All Categories
      </button>

      <hr />

      {categories.map((category) => (
        <div
          key={category}
          className="flex justify-between items-center px-4 py-3 hover:bg-gray-100"
        >
          <button
          onClick={() => {
          setOpenDropdown(false);
         }}
         className="flex-1 text-left"
         >
           {category}
           </button>

           <button
      onClick={(e) => {
        e.stopPropagation();
        deleteCategory(category);
      }}
      className="text-red-500 hover:text-red-700"
    >
      <FaTimes />
    </button>
        </div>
      ))}

      <hr />

      <button
        onClick={() => setShowCategoryModal(true)}
        className="w-full text-left px-4 py-3 text-green-600 hover:bg-green-50 flex items-center gap-2"
      >
        <FaPlus />
        Add Category
      </button>

    </div>
  )}

</div>
            

        </div>
      </div>
    </>
  );
}

export default MenuHeader;