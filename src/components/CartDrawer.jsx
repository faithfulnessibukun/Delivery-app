import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaMinus, FaPlus, FaTrash, FaShoppingBag } from "react-icons/fa";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { getStoredArray, CURRENT_USER_KEYS } from "../utils/storage";
import { generateId } from "../utils/idGenerator";

// The slide-in cart panel. It's rendered once in App.jsx (outside the
// routes) so it can appear on top of any page. It reads/writes its state
// through useCart() (see CartContext.jsx) instead of managing its own —
// that's what lets the cart icon on other pages open THIS same drawer.
function CartDrawer() {
  const navigate = useNavigate();
  const { cart, updateCart, isCartOpen, closeCart } = useCart();

  // Adds up price × quantity for every item to get the cart total.
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  // Increases/decreases one item's quantity by `delta` (+1 or -1).
  // If quantity would drop to 0 or below, the item is removed entirely.
  const changeQuantity = (index, delta) => {
    const nextCart = cart
      .map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + delta } : item
      )
      .filter((item) => item.quantity > 0);
    updateCart(nextCart);
  };

  const removeItem = (index) => {
    updateCart(cart.filter((_, i) => i !== index));
  };

  // "Placing an order" here just means: save the current cart as a new
  // entry in localStorage's "orders" list, then empty the cart. There's
  // no payment step — this is a demo/prototype flow.
  const handlePlaceOrder = () => {
  if (cart.length === 0) return;

  const orders = getStoredArray("orders");
  const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEYS.customer)) || null;

  // Saves the order regardless of whether GPS location was obtained, so a
  // denied/blocked/timed-out location prompt can't silently drop the order.
  const saveOrder = (customerLatitude, customerLongitude) => {
    const order = {
      id: generateId(),

      // The vendor who owns the food in this order
      vendorId: cart[0].vendorId,

      // Restaurant name
      restaurantName: cart[0].restaurantName,

      pickupAddress: cart[0].restaurantAddress || " ",

      // Customer who placed the order
      customerId: currentUser?.id || null,
      customerName: currentUser?.fullName || "Guest",
      customerphone: currentUser?.phone || "N/A",

      // All food items ordered
      items: cart,

      // Total price
      total,

      // Order status
      status: "Placed",

      // Time order was placed
      placedAt: Date.now(),

      // Rider information
      riderId: null,
      riderName: null,

      // Rider earnings for this delivery — set by the vendor when they
      // mark the order Ready (see VendorOrders.jsx).
      riderEarnings: null,

      // Customer's live GPS location (null if unavailable/denied)
      customerLatitude,
      customerLongitude,

      // Rider tracking information
      riderLatitude: null,
      riderLongitude: null,
      deliveryStatus: "Waiting for restaurant to confirm order",
    };

    localStorage.setItem(
      "orders",
      JSON.stringify([order, ...orders])
    );
    window.dispatchEvent(new Event("ordersUpdated"));

    updateCart([]);
    toast.success("Order placed!");
    closeCart();
    navigate("/orders");
  };

  if (!navigator.geolocation) {
    saveOrder(null, null);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      saveOrder(position.coords.latitude, position.coords.longitude);
    },
    () => {
      toast.error(
        "Couldn't get your location — placing order without live tracking."
      );
      saveOrder(null, null);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
};

  return (
    <>
      {/* Dark overlay behind the drawer — clicking it closes the drawer,
          same as tapping the X button. */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 bg-[#1F1B16]/50 z-40 transition-opacity duration-300 ${
          isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel. It's always in the DOM — "closed" just means it's
          pushed off-screen to the right (translate-x-full). Toggling to
          translate-x-0 slides it into view, and the transition-transform
          class animates that slide instead of it snapping instantly. */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#FBF6EE] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-[#1F1B16] text-white px-6 py-6 flex items-center justify-between shrink-0">
          <h2
            className="text-2xl font-black tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Your Cart
          </h2>
          
          <button
            onClick={closeCart}
            className="bg-white/10 rounded-full p-2.5 hover:bg-white/20 transition"
          >
            <FaTimes size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {cart.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-10 text-center text-[#8A8378]">
              <FaShoppingBag className="mx-auto mb-3 text-[#D8CDB6]" size={28} />
              Your cart is empty. Go add something tasty.
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div
                  key={`${item.itemId}-${index}`}
                  className="bg-white rounded-2xl shadow p-4 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1F1B16] truncate">
                      {item.name || item.itemName} 
                    </h3>
                    <p className="text-xs text-[#8A8378] truncate">
                      {item.restaurantName}
                    </p>
                    {item.addOns?.length > 0 && (
                      <p className="text-xs text-[#8A8378] mt-0.5 truncate">
                        + {item.addOns.map((addOn) => addOn.name).join(", ")}
                      </p>
                    )}
                    <p className="text-sm font-bold text-[#E8491D] mt-1">
                      ₦{item.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-[#FBF6EE] rounded-xl px-2 py-1.5 border border-[#EDE4D3] shrink-0">
                    <button
                      onClick={() => changeQuantity(index, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow text-[#5A5448] hover:bg-[#F5EFE2]"
                    >
                      <FaMinus size={9} />
                    </button>
                    <span className="w-5 text-center font-bold text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => changeQuantity(index, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow text-[#5A5448] hover:bg-[#F5EFE2]"
                    >
                      <FaPlus size={9} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(index)}
                    className="text-[#D8CDB6] hover:text-[#E8491D] transition shrink-0"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-[#EDE4D3] bg-white shrink-0">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-[#8A8378]">Total</span>
              <span className="text-2xl font-black text-[#1F1B16]">
                ₦{total.toLocaleString()}
              </span>
            </div>
            <button
              onClick={handlePlaceOrder}
              className="w-full bg-[#E8491D] hover:bg-[#C73A15] text-white py-3.5 rounded-2xl font-bold transition shadow-[0_5px_0_0_#A8300F] active:shadow-none active:translate-y-1"
            >
              Place Order · ₦{total.toLocaleString()}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default CartDrawer;
