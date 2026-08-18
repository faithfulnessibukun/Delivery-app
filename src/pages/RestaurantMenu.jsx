import { useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaFire,
  FaMinus,
  FaPlus,
} from "react-icons/fa";
import toast from "react-hot-toast";
import MOCK_MENUS from "../data/mockMenus";
import { useCart } from "../context/CartContext";
import { getStoredArray } from "../utils/storage";

function RestaurantMenu() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { refreshCart, openCart } = useCart();

  const [quantities, setQuantities] = useState({});

  // Check whether mock data is enabled
  const useMockData = useMemo(
    () => localStorage.getItem("useMockData") === "true",
    []
  );

  // Get all menu items
  const menus = useMemo(() => {
    return useMockData ? MOCK_MENUS : getStoredArray("menus");
  }, [useMockData]);

  // IMPORTANT:
  // Only get menu items belonging to THIS vendor
  const restaurantMenus = useMemo(() => {
    return menus.filter(
      (menu) => String(menu.vendorId) === String(vendorId)
    );
  }, [menus, vendorId]);

  // Get restaurant information from the first menu item
  const restaurant = restaurantMenus[0];

  // Restaurant name passed from CustomerHome
  const vendorNameFromState = location.state?.restaurantName;

  // Get quantity
  const getQuantity = (itemKey) => {
    return quantities[itemKey] || 1;
  };

  // Increase/decrease quantity
  const changeQuantity = (itemKey, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [itemKey]: Math.max(1, getQuantity(itemKey) + delta),
    }));
  };

  // Add food to cart
  const handleAddToCart = (item, itemKey) => {
    const cart = getStoredArray("cart");

    const foodName =
      item.foodName ||
      item.name ||
      item.itemName ||
      "Menu item";

    const newCartItem = {
      vendorId: item.vendorId || vendorId,

      restaurantName:
        item.restaurantName ||
        vendorNameFromState ||
        restaurant?.restaurantName ||
        "Restaurant",

      itemId: item.id ?? itemKey,

      name: foodName,

      price: Number(item.price) || 0,

      quantity: getQuantity(itemKey),

      image: item.itemImage || item.image || "",

      addedAt: Date.now(),
    };

    cart.push(newCartItem);

    localStorage.setItem("cart", JSON.stringify(cart));

    refreshCart();

    toast.success(`${foodName} added to cart!`);

    openCart();

    // Reset quantity
    setQuantities((prev) => ({
      ...prev,
      [itemKey]: 1,
    }));
  };

  // If vendor has no menu
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

      {/* Restaurant Header */}
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

      {/* Restaurant Information */}
      <div className="bg-white rounded-t-[2rem] -mt-6 relative px-6 pt-6 pb-4 shadow-sm">

        <h1
          className="text-2xl font-black text-[#1F1B16]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {vendorNameFromState || restaurant.restaurantName}
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

      {/* Menu */}
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

            const foodName =
              item.foodName ||
              item.name ||
              item.itemName ||
              "Menu item";

            return (
              <div
                key={itemKey}
                className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden flex flex-col border-2 border-transparent hover:border-[#F4B740]"
              >

                {/* Food details */}
                <button
                  onClick={() =>
                    navigate(
                      `/restaurant/${vendorId}/menu/${itemKey}`
                    )
                  }
                  className="text-left flex"
                >

                  <img
                    src={
                      item.itemImage ||
                      item.image ||
                      "https://via.placeholder.com/200"
                    }
                    alt={foodName}
                    className="w-28 h-28 object-cover shrink-0"
                  />

                  <div className="p-3 flex flex-col justify-center">

                    <h3 className="font-bold text-[#1F1B16]">
                      {foodName}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-[#8A8378] mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <p className="text-[#E8491D] font-black mt-2">
                      ₦{Number(item.price || 0).toLocaleString()}
                    </p>

                  </div>

                </button>

                {/* Quantity + Add */}
                <div className="flex items-center justify-between gap-2 px-3 pb-3">

                  <div className="flex items-center gap-2 bg-[#FBF6EE] rounded-xl px-2 py-1.5 border border-[#EDE4D3]">

                    <button
                      onClick={() =>
                        changeQuantity(itemKey, -1)
                      }
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow text-[#5A5448] hover:bg-[#F5EFE2]"
                    >
                      <FaMinus size={9} />
                    </button>

                    <span className="w-5 text-center font-bold text-sm">
                      {getQuantity(itemKey)}
                    </span>

                    <button
                      onClick={() =>
                        changeQuantity(itemKey, 1)
                      }
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow text-[#5A5448] hover:bg-[#F5EFE2]"
                    >
                      <FaPlus size={9} />
                    </button>

                  </div>

                  <button
                    onClick={() =>
                      handleAddToCart(item, itemKey)
                    }
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