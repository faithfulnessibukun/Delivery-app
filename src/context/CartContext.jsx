import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { getCart, saveCart, getCurrentUser } from "../utils/supabaseStorage";

// --- What is this file for? ---
// The cart drawer (see CartDrawer.jsx) can be opened from many different
// pages: the header on CustomerHome, the "Add" button on RestaurantMenu,
// the "Add to cart" button on Menuitemdetail. All of those pages need to
// share the SAME cart data and the SAME "is the drawer open?" flag.
//
// Normally in React you'd pass state down as props, but these pages aren't
// nested inside each other — they're separate routes. React Context solves
// that: it lets any component "subscribe" to shared state without passing
// props through every page in between.
//
// How it's used:
//   1. CartProvider wraps the whole app once, in App.jsx.
//   2. Any component calls useCart() to read the cart or open/close it.

// createContext makes a "channel" that CartProvider will broadcast on,
// and useCart() will listen to. Starts as null until CartProvider renders.
const CartContext = createContext(null);

// This component wraps the app and holds the actual cart state.
// Whatever it puts in `value` becomes available to any page/component
// that calls useCart(), no matter how deep it is in the app.
export function CartProvider({ children }) {
  // The cart itself: an array of { name, price, quantity, ... } objects.
  // Starts empty, then loads from Supabase when the component mounts.
  const [cart, setCart] = useState([]);
  // Whether the slide-in cart drawer is currently visible.
  const [isCartOpen, setCartOpen] = useState(false);
  // Track if cart has finished loading from Supabase
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from Supabase when component mounts
  useEffect(() => {
    const loadCart = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.id) {
          const cartItems = await getCart(user.id);
          setCart(cartItems || []);
        }
      } catch (error) {
        console.error("Error loading cart from Supabase:", error);
        setCart([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCart();
  }, []);

  // Saves a new cart both in React state (so the UI updates) and in
  // Supabase (so it's remembered after a page refresh).
  const updateCart = async (nextCart) => {
    setCart(nextCart);
    try {
      const user = await getCurrentUser();
      if (user && user.id) {
        await saveCart(user.id, nextCart);
      }
    } catch (error) {
      console.error("Error saving cart to Supabase:", error);
    }
  };

  // Reload cart from Supabase
  const refreshCart = async () => {
    try {
      const user = await getCurrentUser();
      if (user && user.id) {
        const cartItems = await getCart(user.id);
        setCart(cartItems || []);
      }
    } catch (error) {
      console.error("Error refreshing cart from Supabase:", error);
    }
  };

  const openCart = async () => {
    await refreshCart();
    setCartOpen(true);
  };

  const closeCart = () => setCartOpen(false);

  // Total number of items in the cart (adds up every item's quantity),
  // used for the little badge number on the cart icon.
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // Everything in here is what useCart() will be able to read/call.
  const value = {
    cart,
    cartCount,
    updateCart,
    refreshCart,
    isCartOpen,
    openCart,
    closeCart,
    isLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// The hook every page/component actually uses, e.g.:
//   const { cartCount, openCart } = useCart();
// Throws an error if used outside CartProvider, which would otherwise
// silently return null and cause a confusing crash later.
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
