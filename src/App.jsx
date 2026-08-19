import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Authentication/Login";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Orders from "./pages/Orders";
import CustomerHome from "./pages/CustomerHome";
import RestaurantMenu from "./pages/RestaurantMenu";
import Menuitemdetail from "./pages/Menuitemdetail";
import VendorsImageUpload from "./components/VendorImageUpload";
import Cart from "./pages/Cart";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import { CartProvider } from "./context/CartContext";
import CartDrawer from "./components/CartDrawer";
import VendorOrders from "./pages/VendorOrders";

import RiderDashboard from "./pages/RiderDashboard";
import RiderLayout from "./components/RiderLayout";
import RiderCompletedDeliveries from "./pages/RiderCompletedDeliveries";



// The root component. It sets up:
//   - CartProvider: shares cart state across every page (see CartContext.jsx)
//   - Toaster: renders the little success/error popups triggered by toast.* calls
//   - CartDrawer: the slide-in cart panel, rendered once here so it can
//     appear on top of any page below
//   - Routes: maps each URL path to the page component that should render there
function App() {
  return (
    <CartProvider>
      <Toaster position="top-center" />
      <CartDrawer />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        
        <Route path="/menu" element={<Menu />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/customer-home" element={<CustomerHome />} />
        <Route path="/restaurant/:vendorId" element={<RestaurantMenu />} />
        <Route path="/restaurant/:vendorId/menu/:itemId" element={<Menuitemdetail />} />
        <Route path="/vendor-image-upload" element={<VendorsImageUpload />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/account" element={<Account />} />
        <Route path="/vendor-orders" element={<VendorOrders/>} />
        {/* Catches any URL that didn't match a route above. */}
        <Route path="*" element={<NotFound />} />
        
        <Route element={<RiderLayout />}>
  <Route
    path="/rider-dashboard"
    element={<RiderDashboard />}
  />

  
</Route>
<Route
  path="/rider-completed-deliveries"
  element={<RiderCompletedDeliveries />}
/>
      </Routes>
    </CartProvider>
  );
}

export default App;