import { useParams } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function RestaurantMenu() {
  const [cart, setCart] = useState(
  JSON.parse(localStorage.getItem("cart")) || []
);
  const { vendorId } = useParams();
  const navigate = useNavigate();

  const menus =
    JSON.parse(localStorage.getItem("menus")) || [];

  const restaurantMenus = menus.filter(
    (menu) => String(menu.vendorId) === vendorId
  );

  if (restaurantMenus.length === 0) {
    return (
      <div className="p-10 text-center">
        No meals available.
      </div>
    );
  }

  const restaurant = restaurantMenus[0];
      const addToCart = (menu) => {
  let updatedCart = [...cart];

  const existingItem = updatedCart.find(
    (item) => item.id === menu.id
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    updatedCart.push({
      ...menu,
      quantity: 1,
    });
  }

  setCart(updatedCart);

  localStorage.setItem(
    "cart",
    JSON.stringify(updatedCart)
  );
};
  return (
    <div className="min-h-screen bg-gray-100 p-6">

    <div className="flex gap-8">

      {/* Left Side */}
      <div className="w-2/3">

      <h1 className="text-3xl font-bold">
        {restaurant.restaurantName}
      </h1>

      <p className="text-gray-500 mb-8">
        {restaurant.restaurantAddress}
      </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {restaurantMenus.map((menu) => (

          <div
            key={menu.id}
            className="bg-white rounded-xl shadow overflow-hidden"
          >
            <img
              src={menu.image}
              alt={menu.foodName}
              className="w-full h-48 object-cover"
            />

            <div className="p-4">

              <h2 className="font-bold text-xl">
                {menu.foodName}
              </h2>

              <p className="text-gray-500">
                {menu.category}
              </p>

              <p className="text-green-600 font-bold mt-2">
                ₦{menu.price}
              </p>

              <button
              onClick={() => addToCart(menu)}
            className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
             >
                Add to Cart
            </button>

            </div>

          </div>

        ))}
        </div>

      {/* Cart goes here */}
      {/* Right Side Cart */}
<div className="w-1/3">

  <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">

    <h2 className="text-2xl font-bold mb-6">
      🛒 Your Order
    </h2>

    {cart.length === 0 ? (

      <div className="text-center text-gray-500 py-12">
        <p>Your cart is empty.</p>
        <p className="text-sm mt-2">
          Add meals from this restaurant.
        </p>
      </div>

    ) : (

      <>
        {cart
  .filter((item) => item.vendorId === restaurant.vendorId)
  .map((item) => (

          <div
            key={item.id}
            className="flex gap-3 border-b py-4"
          >

            <img
              src={item.image}
              alt={item.foodName}
              className="w-16 h-16 rounded-lg object-cover"
            />

            <div className="flex-1">

              <h3 className="font-semibold">
                {item.foodName}
              </h3>

              <p className="text-sm text-gray-500">
                {item.restaurantName}
              </p>

              <p className="text-green-600 font-bold">
                ₦{item.price}
              </p>

              <div className="flex items-center gap-3 mt-2">

  <button
    onClick={() => decreaseQuantity(item.id)}
    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
  >
    -
  </button>

  <span className="font-semibold">
    {item.quantity}
  </span>

  <button
    onClick={() => increaseQuantity(item.id)}
    className="w-8 h-8 rounded-full bg-green-600 text-white hover:bg-green-700"
  >
    +
  </button>

</div>

            </div>

          </div>

        ))}

        <div className="mt-6 border-t pt-4">

          <div className="flex justify-between font-bold text-lg">

            <span>Total</span>

            <span>
              ₦
              {cart
  .filter((item) => item.vendorId === restaurant.vendorId)
  .reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  )}
            </span>

          </div>

          <button
            className="mt-5 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
          >
            Checkout
          </button>

        </div>
      </>
    )}

  </div>

</div>
      </div>

    </div>
  );
}

export default RestaurantMenu;