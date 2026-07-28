import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaMapMarkerAlt, FaFire } from "react-icons/fa";

const getStoredArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

// Route: /restaurant/:vendorId
function RestaurantMenu() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const menus = useMemo(() => getStoredArray("menus"), []);
  const restaurantMenus = useMemo(
    () => menus.filter((menu) => String(menu.vendorId) === String(vendorId)),
    [menus, vendorId]
  );
  const restaurant = restaurantMenus[0];

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
          {restaurantMenus.map((item, index) => (
            <button
              key={item.id ?? index}
              onClick={() =>
                navigate(`/restaurant/${vendorId}/menu/${item.id ?? index}`)
              }
              className="text-left bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden flex border-2 border-transparent hover:border-[#F4B740]"
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
          ))}
        </div>
      </div>
    </div>
  );
}

export default RestaurantMenu;