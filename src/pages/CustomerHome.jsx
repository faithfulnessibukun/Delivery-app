import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaMotorcycle,
  FaUtensils,
  FaMapMarkerAlt,
  FaFire,
  FaLocationArrow,
  FaFlask,
  FaCircle,
  FaBoxOpen,
  FaShoppingBag,
} from "react-icons/fa";
import AdvertVideo from "../assets/Advert.mp4";
import CustomerNav from "../components/CustomerNav";
import MOCK_MENUS from "../data/mockMenus";
import { useCart } from "../context/CartContext";
import { CURRENT_USER_KEYS } from "../utils/storage";

// Cycle of accent colors from the Chop Chop palette — used to give each
// category / restaurant ribbon a distinct, deliberate identity instead
// of everything defaulting to the same chili accent.
const ACCENTS = [
  { solid: "bg-[#3B6255]", soft: "bg-[#E3EAE6]", text: "text-[#3B6255]" },
  { solid: "bg-[#F4B740]", soft: "bg-[#FCF0D6]", text: "text-[#9C7311]" },
  { solid: "bg-[#E8491D]", soft: "bg-[#FCE7DD]", text: "text-[#E8491D]" },
  { solid: "bg-[#6B4A8A]", soft: "bg-[#EEE6F4]", text: "text-[#6B4A8A]" },
];


// Returns a greeting that changes with the time of day.
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// This is the main screen customers land on after logging in.
// It shows: a search bar, a promo video with two service buttons,
// food categories, a list of restaurants, and a "send a package" form.
function CustomerHome() {
  // Which category chip is currently selected (defaults to "All").
  const [selectedCategory, setSelectedCategory] = useState("All");
  // What the user has typed into the search box.
  const [searchTerm, setSearchTerm] = useState("");
  // Tracks the browser's geolocation lookup so we can show a live status pill.
  const [location, setLocation] = useState({
    status: "loading", // loading | ready | denied | error
    label: "",
    latitude: null,
    longitude: null,
  });
  // "Mock data" lets us preview the page with sample restaurants instead of
  // whatever is actually saved in localStorage — handy for demos/testing.
  const [useMockData, setUseMockData] = useState(
    () => localStorage.getItem("useMockData") === "true"
  );
  // Fields for the "Send a Package" form further down the page.
  const [pickupAddress, setPickupAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [packageSize, setPackageSize] = useState("Small");
  const navigate = useNavigate();
  // Shared cart state (item count + a function to open the cart drawer)
  // comes from CartContext so it works the same on every page.
  const { cartCount, openCart } = useCart();

  // Refs let us scroll smoothly to the Restaurants / Send a Package
  // sections when the buttons inside the video are clicked.
  const restaurantsRef = useRef(null);
  const riderRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const canBookRider =
    pickupAddress.trim().length > 0 && destinationAddress.trim().length > 0;

  // Who is logged in right now (saved during login). Used just for the
  // "Good morning, <name>" greeting.
  const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEYS.customer)) || null;
  const customerLocation = currentUser?.id
  ? JSON.parse(
      localStorage.getItem(
        `customerLocation_${currentUser.id}`
      )
    ) || null
  : null;
  const firstName = currentUser?.fullName?.split(" ")[0] || "there";

  // "menus" is the full list of individual menu items saved by vendors.
  // Depending on the mock-data toggle, we either use that real data or
  // the sample MOCK_MENUS list.
  const [menus, setMenus] = useState(() =>
    useMockData ? MOCK_MENUS : JSON.parse(localStorage.getItem("menus")) || []
  );

  // Keep `menus` in sync when toggling mock data or when another page
  // updates localStorage (Menu.jsx dispatches a `menusUpdated` event).
  useEffect(() => {
    setMenus(useMockData ? MOCK_MENUS : JSON.parse(localStorage.getItem("menus")) || []);
  }, [useMockData]);

  useEffect(() => {
    const handler = () => {
      setMenus(useMockData ? MOCK_MENUS : JSON.parse(localStorage.getItem("menus")) || []);
    };

    window.addEventListener("menusUpdated", handler);
    return () => window.removeEventListener("menusUpdated", handler);
  }, [useMockData]);

  const toggleMockData = () => {
    const next = !useMockData;
    setUseMockData(next);
    localStorage.setItem("useMockData", String(next));
  };
  const handleBookRider = () => {
  if (!pickupAddress.trim() || !destinationAddress.trim()) {
    alert("Please enter pickup and destination addresses.");
    return;
  }

  const currentUser =
    JSON.parse(localStorage.getItem(CURRENT_USER_KEYS.customer)) || null;

  const courierOrders =
    JSON.parse(localStorage.getItem("courierOrders")) || [];

  // Get customer's current GPS location
  if (!navigator.geolocation) {
    alert("Your browser does not support GPS location.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const customerLatitude = position.coords.latitude;
      const customerLongitude = position.coords.longitude;

      const courierOrder = {
        id: Date.now(),

        // Customer information
        customerId: currentUser?.id || null,
        customerName: currentUser?.fullName || "Guest",
        customerPhone: currentUser?.phone || "N/A",

        // Package locations
        pickupAddress,
        destinationAddress,

        // Customer GPS location
        customerLatitude,
        customerLongitude,

        // Package information
        packageSize,

        // Delivery fee — set by the rider when they accept the job (see
        // RiderCourierOrders.jsx).
        deliveryFee: null,

        // Courier status
        status: "Waiting for Rider",

        // Rider information
        riderId: null,
        riderName: null,

        // Rider GPS location
        riderLatitude: null,
        riderLongitude: null,

        // Time booked
        createdAt: Date.now(),
      };

      localStorage.setItem(
        "courierOrders",
        JSON.stringify([
          courierOrder,
          ...courierOrders,
        ])
      );

      // Tell other pages that a new courier order exists
      window.dispatchEvent(
        new Event("courierOrdersUpdated")
      );

      alert("Rider booked successfully!");

      // Clear form
      setPickupAddress("");
      setDestinationAddress("");
      setPackageSize("Small");
    },

    () => {
      alert(
        "Please allow location access so we can locate you for delivery."
      );
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
};




  // Menu items belong to restaurants, but the same restaurant can have many
  // items. This turns the flat list of menu items into a de-duplicated list
  // of restaurants (one card per vendorId) for the "Restaurants" section.
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

  // Builds the list of category chips ("All", "Pizza", "Local", ...) from
  // whatever categories actually appear in the current menu items.
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
    setLocation({
      status: "error",
      label: "Location unavailable",
      latitude: null,
      longitude: null,
    });
    return;
  }

  const currentUser =
    JSON.parse(localStorage.getItem(CURRENT_USER_KEYS.customer)) || null;

  // Watch the customer's location continuously
  const watchId = navigator.geolocation.watchPosition(
    async ({ coords }) => {
      const latitude = coords.latitude;
      const longitude = coords.longitude;

      try {
        const res = await fetch(
  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
);

        const data = await res.json();

        const area =
          data?.address?.suburb ||
          data?.address?.neighbourhood ||
          data?.address?.city_district ||
          data?.address?.city ||
          data?.address?.town ||
          "";

        const city =
          data?.address?.city ||
          data?.address?.state ||
          "";

        const label =
          [area, city].filter(Boolean).join(", ") ||
          data?.display_name ||
          "Current location";

        setLocation({
          status: "ready",
          label,
          latitude,
          longitude,
        });

        // Save the customer's live GPS location
        // so the order/rider can use it later.
        if (currentUser?.id) {
          const customerLocation = {
            latitude,
            longitude,
            label,
            updatedAt: Date.now(),
          };

          localStorage.setItem(
            `customerLocation_${currentUser.id}`,
            JSON.stringify(customerLocation)
          );

          // Tell other parts of the app that the location changed
          window.dispatchEvent(
            new Event("customerLocationUpdated")
          );
        }
      } catch {
        const label = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        setLocation({
          status: "ready",
          label,
          latitude,
          longitude,
        });

        if (currentUser?.id) {
          localStorage.setItem(
            `customerLocation_${currentUser.id}`,
            JSON.stringify({
              latitude,
              longitude,
              label,
              updatedAt: Date.now(),
            })
          );
        }
      }
    },

    () => {
      setLocation({
        status: "denied",
        label: "Turn on location access",
        latitude: null,
        longitude: null,
      });
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    }
  );

  // Stop watching location when the customer leaves the page
  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}, []);

  return (
    <div className="min-h-screen bg-[#FBF6EE]">
      {/* Header */}
      <div className="bg-[#1F1B16] text-white px-6 md:px-10 lg:px-16 py-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #F4B740 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h1
              className="text-3xl font-black tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className="mt-1 text-[#C9C2B4]">What are we chopping today?</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Dev/demo helper: flips between real saved menus and sample data. */}
            <button
              onClick={toggleMockData}
              title="Toggle sample data for testing"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition ${
                useMockData
                  ? "bg-[#F4B740] text-[#1F1B16] border-[#F4B740]"
                  : "bg-white/10 text-[#C9C2B4] border-white/10 hover:bg-white/20"
              }`}
            >
              <FaFlask size={11} />
              Mock data {useMockData ? "on" : "off"}
            </button>

            {/* Opens the cart drawer (see CartDrawer.jsx). The little badge
                only shows once there's at least one item in the cart. */}
            <button
              onClick={openCart}
              className="relative bg-white/10 border border-white/10 hover:bg-white/20 rounded-full p-2.5 transition"
            >
              <FaShoppingBag size={16} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#E8491D] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Live location pill — the page's signature status indicator */}
        <div className="relative mt-6 ml-2 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full pl-3 pr-4 py-2 max-w-full border border-white/10">
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

      {/* Video hero — promo + both services embedded directly on the video */}
      <div className="mx-6 md:mx-10 lg:mx-16 mt-6 mb-8 rounded-3xl overflow-hidden shadow-xl relative animate-[fadeIn_0.6s_ease-out]">
        <video
          className="w-full h-96 md:h-[26rem] object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={AdvertVideo} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1B16]/90 via-[#1F1B16]/25 to-[#1F1B16]/40" />

        <div className="absolute inset-0 flex flex-col justify-between px-6 py-6 md:px-8 md:py-7 text-white">
          <div className="animate-[fadeIn_0.6s_ease-out_0.1s_both]">
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

          <div className="grid grid-cols-2 gap-3 animate-[floatIn_0.7s_cubic-bezier(0.22,1,0.36,1)_0.2s_both]">
            <button
              onClick={() => scrollToSection(restaurantsRef)}
              className="group text-left bg-white/15 backdrop-blur-xl rounded-2xl p-4 border border-white/25 transition-all duration-300 hover:bg-white/25 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:scale-[0.98]"
            >
              <div className="w-11 h-11 rounded-xl bg-[#F4B740] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <FaUtensils className="text-[#1F1B16]" />
              </div>
              <h3 className="font-bold mt-3">Order Food</h3>
              <p className="text-xs text-[#E5DFD3] mt-1">
                Browse restaurants near you
              </p>
            </button>

            <button
              onClick={() => scrollToSection(riderRef)}
              className="group text-left bg-white/15 backdrop-blur-xl rounded-2xl p-4 border border-white/25 transition-all duration-300 hover:bg-white/25 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:scale-[0.98]"
            >
              <div className="w-11 h-11 rounded-xl bg-[#F4B740] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <FaMotorcycle className="text-[#1F1B16]" />
              </div>
              <h3 className="font-bold mt-3">Send a Package</h3>
              <p className="text-xs text-[#E5DFD3] mt-1">
                Fast, reliable delivery
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 md:px-10 lg:px-16 py-6">
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
      <div ref={restaurantsRef} className="px-6 md:px-10 lg:px-16 pb-10 scroll-mt-6">
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
                      onClick={() =>
                        navigate(`/restaurant/${restaurant.vendorId}`, {
                          state: { restaurantName: restaurant.restaurantName },
                        })
                      }
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

      {/* Send a Package — pickup/destination + mock fare estimate */}
      <div ref={riderRef} className="px-6 md:px-10 lg:px-16 pb-24 scroll-mt-6">
        <h2
          className="text-2xl font-black mb-4 text-[#1F1B16]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Send a Package
        </h2>

        <div className="bg-white rounded-3xl shadow p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-[#FBF6EE] rounded-2xl px-4 py-3.5">
              <FaCircle className="text-[#3B6255] shrink-0" size={10} />
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Pickup address"
                className="flex-1 outline-none bg-transparent text-[#1F1B16] placeholder:text-[#A8A096] font-medium"
              />
            </div>

            <div className="flex items-center gap-3 bg-[#FBF6EE] rounded-2xl px-4 py-3.5">
              <FaMapMarkerAlt className="text-[#E8491D] shrink-0" size={12} />
              <input
                type="text"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="Destination address"
                className="flex-1 outline-none bg-transparent text-[#1F1B16] placeholder:text-[#A8A096] font-medium"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            {["Small", "Medium", "Large"].map((size) => (
              <button
                key={size}
                onClick={() => setPackageSize(size)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${
                  packageSize === size
                    ? "bg-[#1F1B16] text-white shadow"
                    : "bg-[#FBF6EE] text-[#5A5448] hover:bg-[#EDE4D3]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-[#EDE4D3] flex items-center gap-2 text-[#8A8378]">
            <FaBoxOpen size={14} />
            <span className="text-sm font-medium">
              A rider will quote the delivery fee once they accept your request.
            </span>
          </div>

          <button
          onClick={handleBookRider}
            disabled={!canBookRider}
            className="mt-5 w-full bg-[#3B6255] hover:bg-[#2E4C42] disabled:bg-[#D8CDB6] disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition"
          >
            Book a Rider
          </button>
        </div>
      </div>

      <CustomerNav />
    </div>
  );
}

export default CustomerHome;