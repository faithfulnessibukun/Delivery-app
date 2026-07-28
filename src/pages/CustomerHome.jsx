import {useState} from "react";
import {useNavigate} from "react-router-dom";
import { 
  FaSearch, 
  FaMotorcycle, 
  FaWallet, 
  FaStar,
  FaMapMarkerAlt, 
} from "react-icons/fa";
  import AdvertVideo from "../assets/Advert.mp4";


function CustomerHome() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();
 

  const menus = JSON.parse(localStorage.getItem("menus")) || [];
  const restaurants = [
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
        },
      ])
  ).values(),
];
  

const categories = [
  "All",
  ...new Set(menus.map((menu) => menu.category)),
];

const filteredMenus =
  selectedCategory === "All"
    ? menus
    : menus.filter(
        (menu) => menu.category === selectedCategory
      );

  
  

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-green-600 text-white p-6 rounded-b-3xl shadow">
        <h1 className="text-3xl font-bold">
          Hello Ibukun👋
        </h1>

        <p className="mt-1">
          What would you like today?
        </p>

        <div className="bg-white rounded-xl flex items-center mt-6 px-4 py-3">
          <FaSearch className="text-gray-400" />

          <input
            type="text"
            placeholder="Search restaurants or food..."
            className="flex-1 ml-3 outline-none text-black"
          />
        </div>
      </div>
     

<div className="mx-6 mt-6 mb-6 rounded-2xl overflow-hidden shadow-lg relative">
  <video
    className="w-full h-64 md:h-80 object-cover"
    autoPlay
    muted
    loop
    playsInline
  >
    <source src={AdvertVideo} type="video/mp4" />
  </video>

  <div className="absolute inset-0 bg-black/40"></div>

  <div className="absolute inset-0 flex flex-col justify-center px-8 text-white">
    <h2 className="text-4xl font-bold">30% OFF</h2>
    <p className="mt-2 text-lg">On Your First Order</p>
    <button
    className="mt-6 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold w-44">
      Order Now
  </button>
    
  </div>
</div>
     

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 p-6">

        <div className="bg-white rounded-xl shadow p-5 text-center cursor-pointer hover:shadow-lg">
          <FaMotorcycle className="text-3xl mx-auto text-green-600" />

          <h2 className="font-semibold mt-3">
            Send Package
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5 text-center cursor-pointer hover:shadow-lg">
          <FaWallet className="text-3xl mx-auto text-blue-600" />

          <h2 className="font-semibold mt-3">
            Wallet
          </h2>
        </div>

      </div>
       {/* Categories */}

      <div className="p-6">

        <h2 className="font-bold text-xl mb-4">
          Categories
        </h2>

        <div className="flex gap-3 overflow-x-auto">

          {categories.map((item) => (
            <button
  key={item}
  onClick={() => setSelectedCategory(item)}
  className={`px-5 py-3 rounded-xl whitespace-nowrap transition
    ${
      selectedCategory === item
        ? "bg-green-600 text-white"
        : "bg-white shadow hover:bg-green-600 hover:text-white"
    }`}
>
  {item}
</button>
          ))}

        </div>
        </div>
      
     {/* Restaurants */}
<div className="px-6">
  <h2 className="text-2xl font-bold mb-4">
    Restaurants
  </h2>

  <div className="grid md:grid-cols-3 gap-6">
    {restaurants.map((restaurant) => (
      <div
        key={restaurant.vendorId}
        className="bg-white rounded-xl shadow overflow-hidden hover:shadow-xl"
      >
        <img
          src={restaurant.image || "https://via.placeholder.com/600x400"}
          alt={restaurant.restaurantName}
          className="w-full h-48 object-cover"
        />

        <div className="p-4">
          <h3 className="font-bold text-lg">
            {restaurant.restaurantName}
          </h3>

          <p className="text-sm text-gray-500">
            {restaurant.restaurantAddress}
          </p>

          <button
            onClick={() => navigate(`/restaurant/${restaurant.vendorId}`)}
            className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            View Menu
          </button>
        </div>
      </div>
    ))}
  </div>
</div>



    </div>
  );
}

export default CustomerHome;