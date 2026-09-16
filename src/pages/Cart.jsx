import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

// The cart is a global drawer now (see CartDrawer), not a standalone page.
// This route exists only so a direct link to /cart still does something
// sensible: land on the home feed with the drawer open.
function Cart() {
  
  const navigate = useNavigate();
  const { openCart } = useCart();

  useEffect(() => {
    const openAndNavigate = async () => {
      await openCart();
      navigate("/customer-home", { replace: true });
    };
    openAndNavigate();
  }, [navigate, openCart]);

  return null;
}

export default Cart;
