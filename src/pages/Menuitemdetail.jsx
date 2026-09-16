import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaMinus, FaPlus, FaCheck } from "react-icons/fa";
import ADD_ONS from "../data/addOns";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";
import { getCart, saveCart, getCurrentUser } from "../utils/supabaseStorage";

// This page shows one menu item in detail: description, price, optional
// add-ons, a quantity picker, and an "Add to cart" button.
// Route: /restaurant/:vendorId/menu/:itemId
function MenuItemDetail() {
  const { vendorId, itemId } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  // Which add-on ids the customer has checked, e.g. ["extra-cheese"].
  const [selectedAddOnIds, setSelectedAddOnIds] = useState([]);
  const { refreshCart, openCart } = useCart();

  // This restaurant's menu items, loaded from Supabase.
  const [restaurantMenus, setRestaurantMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMenus = async () => {
      // Find this vendor's restaurant first, so we can filter menu_items
      // by restaurant_id (the actual foreign key in the schema).
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("restaurant_id, name, address_line")
        .eq("vendor_id", vendorId)
        .single();

      if (!restaurant) {
        setRestaurantMenus([]);
        setIsLoading(false);
        return;
      }

      const { data: items, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurant.restaurant_id);

      if (error) {
        console.error("Error loading menu item:", error);
        setRestaurantMenus([]);
        setIsLoading(false);
        return;
      }

      const mapped = (items || []).map((item) => ({
        id: item.menu_item_id,
        vendorId,
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address_line,
        name: item.name,
        itemName: item.name,
        description: item.description,
        price: item.price,
        image: item.image_url,
        itemImage: item.image_url,
        category: item.category,
      }));

      setRestaurantMenus(mapped);
      setIsLoading(false);
    };

    loadMenus();
  }, [vendorId]);

  const toggleAddOn = (addOnId) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(addOnId)
        ? prev.filter((id) => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  // Find which menu item this page is for. The URL's itemId is either:
  //   1. a real item id (most items — try matching by `id` first), or
  //   2. a plain list position/index (used as a fallback when an item has
  //      no `id`, e.g. `restaurantMenus[2]` for the 3rd item in the list —
  //      this is the same order/index RestaurantMenu.jsx used to build the link).
  const item =
    restaurantMenus.find((menu) => String(menu.id) === String(itemId)) ||
    restaurantMenus[Number(itemId)];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF6EE] flex items-center justify-center">
        <p className="text-[#8A8378]">Loading...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#FBF6EE] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[#8A8378] mb-4">This menu item wasn't found.</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-[#E8491D] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#C73A15] transition"
        >
          Go back
        </button>
      </div>
    );
  }

  const basePrice = Number(item.price) || 0;

  // The full list of add-ons the customer has checked (name + price),
  // and how much they add to the price of one unit of this item.
  const selectedAddOns = ADD_ONS.filter((addOn) =>
    selectedAddOnIds.includes(addOn.id)
  );
  const addOnsTotal = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
  const price = basePrice + addOnsTotal;

  const handleAddToCart = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      const cart = await getCart(user.id);

      cart.push({
        vendorId,
        restaurantName: item.restaurantName,
        itemId: item.id ?? itemId,
        name: item.name || item.itemName,
        price,
        quantity,
        addOns: selectedAddOns,
        addedAt: new Date().toISOString(),
      });

      await saveCart(user.id, cart);
      await refreshCart();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      await openCart();
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF6EE] pb-28">
      <div className="relative">
        <img
          src={item.itemImage || item.image || "https://via.placeholder.com/800x500"}
          alt={item.name || item.itemName}
          className="w-full h-72 object-cover"
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-5 bg-white/90 rounded-full p-3 shadow hover:bg-white transition"
        >
          <FaArrowLeft className="text-[#1F1B16]" />
        </button>
      </div>

      <div className="bg-white rounded-t-[2rem] -mt-6 relative px-6 pt-6 pb-8 shadow-sm">
        {(item.foodName || item.name || item.itemName) && (
          <span className="inline-block bg-[#FCF0D6] text-[#9C7311] text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
            {item.foodName || item.name || item.itemName}
          </span>
        )}

        <h1
          className="text-2xl font-black text-[#1F1B16]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {item.name || item.itemName}
        </h1>
        <p className="text-sm text-[#8A8378] mt-1">{item.restaurantName}</p>

        {item.description && (
          <p className="text-[#5A5448] mt-4 leading-relaxed">
            {item.description}
          </p>
        )}

        <p className="text-2xl font-black text-[#E8491D] mt-6">
          ₦{basePrice.toLocaleString()}
        </p>

        {/* Add-ons / extras — optional, each one adds to the item's price. */}
        <div className="mt-6">
          <span className="font-bold text-[#1F1B16]">Add-ons</span>
          <div className="mt-3 space-y-2">
            {ADD_ONS.map((addOn) => {
              const isSelected = selectedAddOnIds.includes(addOn.id);
              return (
                <button
                  key={addOn.id}
                  onClick={() => toggleAddOn(addOn.id)}
                  className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 border-2 transition ${
                    isSelected
                      ? "border-[#E8491D] bg-[#FCE7DD]"
                      : "border-[#EDE4D3] bg-[#FBF6EE] hover:border-[#D8CDB6]"
                  }`}
                >
                  <span className="flex items-center gap-2 font-medium text-[#1F1B16]">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2 ${
                        isSelected
                          ? "bg-[#E8491D] border-[#E8491D] text-white"
                          : "border-[#D8CDB6]"
                      }`}
                    >
                      {isSelected && <FaCheck size={10} />}
                    </span>
                    {addOn.name}
                  </span>
                  <span className="text-sm font-bold text-[#8A8378]">
                    +₦{addOn.price.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity stepper */}
        <div className="flex items-center gap-4 mt-6">
          <span className="font-bold text-[#1F1B16]">Quantity</span>
          <div className="flex items-center gap-3 bg-[#FBF6EE] rounded-2xl px-3 py-2 border-2 border-[#EDE4D3]">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white shadow text-[#5A5448] hover:bg-[#F5EFE2]"
            >
              <FaMinus size={10} />
            </button>
            <span className="w-6 text-center font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white shadow text-[#5A5448] hover:bg-[#F5EFE2]"
            >
              <FaPlus size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky add-to-cart bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#EDE4D3] px-6 py-4">
        <button
          onClick={handleAddToCart}
          className="w-full bg-[#E8491D] text-white py-3.5 rounded-2xl font-bold hover:bg-[#C73A15] transition flex items-center justify-center gap-2 shadow-[0_5px_0_0_#A8300F] active:shadow-none active:translate-y-1"
        >
          {added
            ? "Added to cart ✓"
            : `Add ${quantity} to cart · ₦${(price * quantity).toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}

export default MenuItemDetail;