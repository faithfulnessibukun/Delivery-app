import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaMinus, FaPlus } from "react-icons/fa";

const getStoredArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

// Route: /restaurant/:vendorId/menu/:itemId
function MenuItemDetail() {
  const { vendorId, itemId } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const menus = useMemo(() => getStoredArray("menus"), []);

  const restaurantMenus = useMemo(
    () => menus.filter((menu) => String(menu.vendorId) === String(vendorId)),
    [menus, vendorId]
  );

  // Items may or may not have a stable `id`, so fall back to matching
  // by position within that restaurant's menu (same order used to build
  // the link in RestaurantMenu).
  const item =
    restaurantMenus.find((menu) => String(menu.id) === String(itemId)) ||
    restaurantMenus[Number(itemId)];

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

  const price = Number(item.price) || 0;

  const handleAddToCart = () => {
    const cart = getStoredArray("cart");

    cart.push({
      vendorId,
      restaurantName: item.restaurantName,
      itemId: item.id ?? itemId,
      name: item.name || item.itemName,
      price,
      quantity,
      addedAt: Date.now(),
    });

    localStorage.setItem("cart", JSON.stringify(cart));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
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
        {item.category && (
          <span className="inline-block bg-[#FCF0D6] text-[#9C7311] text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
            {item.category}
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
          ₦{price.toLocaleString()}
        </p>

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