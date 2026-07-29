import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaMapMarkerAlt, FaFire, FaMinus, FaPlus } from "react-icons/fa";
import toast from "react-hot-toast";
import MOCK_MENUS from "../data/mockMenus";
import { useCart } from "../context/CartContext";
import { getStoredArray } from "../utils/storage";

// This page shows one restaurant's full menu.
// Route: /restaurant/:vendorId  (vendorId comes from the URL)
function RestaurantMenu() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { refreshCart, openCart } = useCart();

  // One quantity counter per menu item, keyed by that item's id.
  // Example: { "mock-1-a": 2, "mock-1-b": 1 }
  const [quantities, setQuantities] = useState({});

  // If the "Mock data" toggle is on (set from CustomerHome), show the
  // sample restaurants instead of whatever is actually saved in
  // localStorage under "menus".
  const useMockData = useMemo(
    () => localStorage.getItem("useMockData") === "true",
    []
  );
  const menus = useMemo(
    () => (useMockData ? MOCK_MENUS : getStoredArray("menus")),
    [useMockData]
  );
  // "menus" holds every item from every restaurant, so we filter down to
  // just the items belonging to this restaurant's vendorId.
  const restaurantMenus = useMemo(
    () => menus.filter((menu) => String(menu.vendorId) === String(vendorId)),
    [menus, vendorId]
  );
  // Every item in restaurantMenus repeats the same restaurant info
  // (name, address, image...), so we can just grab it from the first one.
  const restaurant = restaurantMenus[0];

  // Reads the current quantity for one item (defaults to 1 so the stepper
  // never shows 0 — tapping "Add" always adds at least one).
  const getQuantity = (itemKey) => quantities[itemKey] || 1;

  const changeQuantity = (itemKey, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [itemKey]: Math.max(1, getQuantity(itemKey) + delta),
    }));
  };

  // Adds the chosen quantity of one item straight to the cart, without
  // navigating to the item's detail page first.
  const handleAddToCart = (item, itemKey) => {
    const cart = getStoredArray("cart");

    cart.push({
      vendorId,
      restaurantName: item.restaurantName,
      itemId: item.id ?? itemKey,
      name: item.name || item.itemName,
      price: Number(item.price) || 0,
      quantity: getQuantity(itemKey),
      addedAt: Date.now(),
    });

    localStorage.setItem("cart", JSON.stringify(cart));
    refreshCart();
    toast.success("Added to cart!");
    openCart();

    // Reset that item's stepper back to 1 for the next add.
    setQuantities((prev) => ({ ...prev, [itemKey]: 1 }));
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#FBF6EE] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[#8A8378] mb-4">
          This restaurant doesn't have a menu yet.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="bg-[#E8491D] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#C73A15] transition"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF6EE]">
      {/* Header */}
      <div className="relative">
        <img
          src={restaurant.image || "https://via.placeholder.com/800x400"}
          alt={restaurant.restaurantName}
          className="w-full h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1B16]/50 via-transparent to-[#1F1B16]/20" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-5 bg-white/90 rounded-full p-3 shadow hover:bg-white transition"
        >
          <FaArrowLeft className="text-[#1F1B16]" />
        </button>
      </div>

      <div className="bg-white rounded-t-[2rem] -mt-6 relative px-6 pt-6 pb-4 shadow-sm">
        <h1
          className="text-2xl font-black text-[#1F1B16]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {restaurant.restaurantName}
        </h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-[#8A8378]">
          <span className="flex items-center gap-1">
            <FaMapMarkerAlt size={12} />
            {restaurant.restaurantAddress}
          </span>
          <span className="flex items-center gap-1 text-[#E8491D] font-bold">
            <FaFire size={12} />
            {restaurant.rating || 4.5}
          </span>
        </div>
      </div>

      {/* Menu list */}
      <div className="px-6 py-6">
        <h2
          className="font-black text-xl mb-4 text-[#1F1B16]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Menu
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {restaurantMenus.map((item, index) => {
            const itemKey = item.id ?? index;

            return (
              <div
                key={itemKey}
                className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden flex flex-col border-2 border-transparent hover:border-[#F4B740]"
              >
                {/* Tapping the image/name opens the full item detail page. */}
                <button
                  onClick={() =>
                    navigate(`/restaurant/${vendorId}/menu/${itemKey}`)
                  }
                  className="text-left flex"
                >
                  <img
                    src={item.itemImage || item.image || "https://via.placeholder.com/200"}
                    alt={item.name || item.itemName}
                    className="w-28 h-28 object-cover shrink-0"
                  />
                  <div className="p-3 flex flex-col justify-center">
                    <h3 className="font-bold text-[#1F1B16]">
                      {item.name || item.itemName || "Menu item"}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-[#8A8378] mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.price && (
                      <p className="text-[#E8491D] font-black mt-2">
                        ₦{Number(item.price).toLocaleString()}
                      </p>
                    )}
                  </div>
                </button>

                {/* Quantity stepper + Add button so you can add this item
                    to the cart without leaving the menu list. */}
                <div className="flex items-center justify-between gap-2 px-3 pb-3">
                  <div className="flex items-center gap-2 bg-[#FBF6EE] rounded-xl px-2 py-1.5 border border-[#EDE4D3]">
                    <button
                      onClick={() => changeQuantity(itemKey, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow text-[#5A5448] hover:bg-[#F5EFE2]"
                    >
                      <FaMinus size={9} />
                    </button>
                    <span className="w-5 text-center font-bold text-sm">
                      {getQuantity(itemKey)}
                    </span>
                    <button
                      onClick={() => changeQuantity(itemKey, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow text-[#5A5448] hover:bg-[#F5EFE2]"
                    >
                      <FaPlus size={9} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleAddToCart(item, itemKey)}
                    className="flex-1 bg-[#E8491D] hover:bg-[#C73A15] text-white py-2 rounded-xl font-bold text-sm transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RestaurantMenu;