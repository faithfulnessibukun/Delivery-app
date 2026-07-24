import { FaSearch, FaMotorcycle, FaWallet, FaStar,
  FaMapMarkerAlt, } from "react-icons/fa";

function CustomerHome() {
  const restaurants = [
    {
      id: 1,
      name: "Chicken Republic",
      category: "Fast Food",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
      rating: 4.9,
      location: "Ede",
    },
    {
      id: 2,
      name: "Domino's Pizza",
      category: "Pizza",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
      rating: 5.9,
      location: "opp Chapel",
    },
    {
      id: 3,
      name: "Sweet Sensation",
      category: "African Meals",
      image:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
      rating: 4.7,
      location: "manna palace",
    },
  ];

  const foods = [
    {
      id: 1,
      name: "Grilled Chicken",
      image:
        "https://images.unsplash.com/photo-1548365328-9f547fb0953b?w=600",
      price: "$12.99",
    },
    {
      id: 2,
      name: "Cheese Burger",
      image:
        "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600",
      price: "$9.99",
    },
    {
      id: 3,
      name: "Vegetable Rice",
      image:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
      price: "$8.49",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-green-600 text-white p-6 rounded-b-3xl shadow">
        <h1 className="text-3xl font-bold">
          Hello 👋
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

          {["🍕 Pizza","🍔 Burger","🍗 Chicken","🍚 Rice","🥤 Drinks","🍰 Dessert"].map((item)=>(
            <button
              key={item}
              className="bg-white shadow px-5 py-3 rounded-xl whitespace-nowrap hover:bg-green-600 hover:text-white"
            >
              {item}
            </button>
          ))}

        </div>
        </div>
      {/* Restaurants */}
      <div className="px-6">

        <h2 className="text-2xl font-bold mb-4">
          Popular Restaurants
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          {restaurants.map((restaurant) => (

            <div
              key={restaurant.id}
              className="bg-white rounded-xl shadow overflow-hidden hover:shadow-xl"
            >
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="w-full h-48 object-cover"
              />

              <div className="p-4">

                <h3 className="font-bold text-lg">
                  {restaurant.name}
                </h3>
                   <p className="text-gray-500">
                  {restaurant.category}
                </p>

                  <div className="flex justify-between mt-2 text-sm">

                  <span className="flex items-center gap-1 text-yellow-500">
                    <FaStar />
                    {restaurant.rating}
                  </span>

                  <span className="flex items-center gap-1 text-gray-500">
                    <FaMapMarkerAlt />
                    {restaurant.location}
                  </span>

                </div>

                

                <button className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                  View Menu
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* Meals */}

      <div className="p-6">

        <h2 className="font-bold text-xl mb-4">
          Popular Meals
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          {foods.map((food)=>(

            <div
              key={food.id}
              className="bg-white rounded-xl overflow-hidden shadow"
            >

              <img
                src={food.image}
                alt={food.name}
                className="h-52 w-full object-cover"
              />

              <div className="p-4">

                <h3 className="font-bold">
                  {food.name}
                </h3>

                <div className="flex justify-between items-center mt-3">

                  <span className="font-bold text-green-600">
                    {food.price}
                  </span>

                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Add
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

export default CustomerHome;