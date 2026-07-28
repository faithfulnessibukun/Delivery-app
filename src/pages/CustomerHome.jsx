import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaMotorcycle,
  FaUtensils,
  FaMapMarkerAlt,
  FaFire,
  FaLocationArrow,
} from "react-icons/fa";
import AdvertVideo from "../assets/Advert.mp4";

// Cycle of accent colors from the Chop Chop palette — used to give each
// category / restaurant ribbon a distinct, deliberate identity instead
// of everything defaulting to the same chili accent.
const ACCENTS = [
  { solid: "bg-[#3B6255]", soft: "bg-[#E3EAE6]", text: "text-[#3B6255]" },
  { solid: "bg-[#F4B740]", soft: "bg-[#FCF0D6]", text: "text-[#9C7311]" },
  { solid: "bg-[#E8491D]", soft: "bg-[#FCE7DD]", text: "text-[#E8491D]" },
  { solid: "bg-[#6B4A8A]", soft: "bg-[#EEE6F4]", text: "text-[#6B4A8A]" },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function CustomerHome() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState({
    status: "loading", // loading | ready | denied | error
    label: "",
  });
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
  const firstName = currentUser?.fullName?.split(" ")[0] || "there";

  const menus = JSON.parse(localStorage.getItem("menus")) || [];

  const restaurants = useMemo(
    () => [
      ...new Map(
        menus
          .filter((menu) => menu.restaurantName)
          .map((menu) => [
            menu.vendorId,
            {
              vendorId: menu.vendorId,
              restaurantName: menu.restaurantName,
              restaurantAddress: menu.restaurantAddress,
              image: menu.image,
              category: menu.category,
              rating: menu.rating || 4.5,
            },
          ])
      ).values(),
    ],
    [menus]
  );

  const categories = useMemo(
    () => ["All", ...new Set(menus.map((menu) => menu.category).filter(Boolean))],
    [menus]
  );

  // Restaurants filtered by the selected category AND the search term.
  // Search matches on restaurant name, address, or any menu item name
  // that belongs to that restaurant.
  const filteredRestaurants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const matchesCategory =
        selectedCategory === "All" || restaurant.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!term) return true;

      const restaurantMatch =
        restaurant.restaurantName?.toLowerCase().includes(term) ||
        restaurant.restaurantAddress?.toLowerCase().includes(term);

      const menuMatch = menus.some(
        (menu) =>
          menu.vendorId === restaurant.vendorId &&
          (menu.name || menu.itemName || "").toLowerCase().includes(term)
      );

      return restaurantMatch || menuMatch;
    });
  }, [restaurants, menus, selectedCategory, searchTerm]);

  // Grab the current location on page load and reverse-geocode it into
  // a human readable label. Falls back gracefully if the user declines
  // or the browser has no geolocation support.
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocation({ status: "error", label: "Location unavailable" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
          );
          const data = await res.json();
          const area =
            data?.address?.suburb ||
            data?.address?.neighbourhood ||
            data?.address?.city_district ||
            data?.address?.city ||
            data?.address?.town ||
            "";
          const city = data?.address?.city || data?.address?.state || "";
          const label = [area, city].filter(Boolean).join(", ") || data?.display_name;
          setLocation({ status: "ready", label: label || "Current location" });
        } catch {
          setLocation({
            status: "ready",
            label: `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`,
          });
        }
      },
      () => setLocation({ status: "denied", label: "Turn on location access" }),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF6EE]">
      {/* Header */}
      <div className="bg-[#1F1B16] text-white p-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #F4B740 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-black tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className="mt-1 text-[#C9C2B4]">What are we chopping today?</p>
          </div>
        </div>

        {/* Live location pill — the page's signature status indicator */}
        <div className="relative mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full pl-3 pr-4 py-2 max-w-full border border-white/10">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {location.status === "loading" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F4B740] opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                location.status === "denied" || location.status === "error"
                  ? "bg-[#E8491D]"
                  : "bg-[#F4B740]"
              }`}
            />
          </span>
          <FaMapMarkerAlt className="text-[#F4B740] shrink-0" size={13} />
          <span className="text-sm font-medium truncate">
            {location.status === "loading" ? "Finding you…" : location.label}
          </span>
        </div>

        <div className="relative bg-[#FBF6EE] rounded-2xl flex items-center mt-6 px-4 py-3.5 shadow-sm">
          <FaSearch className="text-[#A8A096]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search restaurants or food..."
            className="flex-1 ml-3 outline-none bg-transparent text-[#1F1B16] placeholder:text-[#A8A096] font-medium"
          />
        </div>
      </div>

      {/* Advert */}
      <div className="mx-6 mt-6 mb-6 rounded-3xl overflow-hidden shadow-xl relative">
        <video
          className="w-full h-64 md:h-80 object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={AdvertVideo} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1B16]/85 via-[#1F1B16]/20 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end px-8 pb-8 text-white">
          <span className="inline-block w-fit bg-[#F4B740] text-[#1F1B16] text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2">
            Limited time
          </span>
          <h2
            className="text-4xl font-black"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            30% OFF
          </h2>
          <p className="mt-1 text-[#E5DFD3]">On your first order</p>
          <button className="mt-5 bg-[#E8491D] hover:bg-[#C73A15] text-white px-8 py-3 rounded-xl font-bold w-fit transition shadow-[0_5px_0_0_#A8300F] active:shadow-none active:translate-y-1">
            Order Now
          </button>
        </div>
      </div>

      {/* Services — food ordering & delivery */}
      <div className="px-6">
        <h2
          className="font-black text-xl mb-4 text-[#1F1B16]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Services
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button className="text-left bg-white rounded-2xl shadow p-5 hover:shadow-lg transition border-2 border-transparent hover:border-[#E8491D]">
            <div className="w-11 h-11 rounded-xl bg-[#FCE7DD] flex items-center justify-center">
              <FaUtensils className="text-[#E8491D]" />
            </div>
            <h3 className="font-bold mt-4 text-[#1F1B16]">Order Food</h3>
            <p className="text-sm text-[#8A8378] mt-1">
              Browse restaurants near you
            </p>
          </button>

          <button className="text-left bg-white rounded-2xl shadow p-5 hover:shadow-lg transition border-2 border-transparent hover:border-[#3B6255]">
            <div className="w-11 h-11 rounded-xl bg-[#E3EAE6] flex items-center justify-center">
              <FaMotorcycle className="text-[#3B6255]" />
            </div>
            <h3 className="font-bold mt-4 text-[#1F1B16]">Send a Package</h3>
            <p className="text-sm text-[#8A8378] mt-1">
              Fast, reliable delivery
            </p>
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="p-6">
        <h2
          className="font-black text-xl mb-4 text-[#1F1B16]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Categories
        </h2>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {categories.map((item, index) => {
            const accent = ACCENTS[index % ACCENTS.length];
            const isActive = selectedCategory === item;

            return (
              <button
                key={item}
                onClick={() => setSelectedCategory(item)}
                className={`px-5 py-3 rounded-2xl whitespace-nowrap transition font-bold shrink-0
                  ${
                    isActive
                      ? "bg-[#1F1B16] text-white shadow"
                      : item === "All"
                      ? "bg-white text-[#5A5448] shadow hover:bg-[#EDE4D3]"
                      : `${accent.soft} ${accent.text} hover:brightness-95`
                  }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Restaurants */}
      <div className="px-6 pb-10">
        <h2
          className="text-2xl font-black mb-4 text-[#1F1B16]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Restaurants
        </h2>

        {filteredRestaurants.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-[#8A8378]">
            <FaLocationArrow className="mx-auto mb-3 text-[#D8CDB6]" size={28} />
            No restaurants match your search yet. Try a different term or
            category.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant, index) => {
              const accent = ACCENTS[index % ACCENTS.length];

              return (
                <div
                  key={restaurant.vendorId}
                  className="bg-white rounded-2xl shadow overflow-hidden hover:shadow-xl transition"
                >
                  <div className="relative">
                    <img
                      src={restaurant.image || "https://via.placeholder.com/600x400"}
                      alt={restaurant.restaurantName}
                      className="w-full h-48 object-cover"
                    />
                    {restaurant.category && (
                      <span
                        className={`absolute top-3 left-3 ${accent.solid} text-white text-xs font-bold px-3 py-1 rounded-full`}
                      >
                        {restaurant.category}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg text-[#1F1B16]">
                        {restaurant.restaurantName}
                      </h3>
                      <span className="flex items-center gap-1 text-sm font-bold text-[#E8491D] shrink-0">
                        <FaFire size={12} />
                        {restaurant.rating}
                      </span>
                    </div>

                    <p className="text-sm text-[#8A8378] mt-1 flex items-center gap-1">
                      <FaMapMarkerAlt size={12} className="shrink-0" />
                      {restaurant.restaurantAddress}
                    </p>

                    <button
                      onClick={() => navigate(`/restaurant/${restaurant.vendorId}`)}
                      className="mt-4 w-full bg-[#E8491D] text-white py-2.5 rounded-xl hover:bg-[#C73A15] transition font-bold"
                    >
                      View Menu
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerHome;