import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
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

function App() {
  return (
    <CartProvider>
      <Analytics />
      <Toaster position="top-center" />
      <CartDrawer />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/customer-home" element={<CustomerHome />} />
        <Route path="/restaurant/:vendorId" element={<RestaurantMenu />} />
        <Route
          path="/restaurant/:vendorId/menu/:itemId"
          element={<Menuitemdetail />}
        />
        <Route path="/vendor-image-upload" element={<VendorsImageUpload />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/account" element={<Account />} />
        <Route path="/vendor-orders" element={<VendorOrders />} />

        <Route element={<RiderLayout />}>
          <Route path="/rider-dashboard" element={<RiderDashboard />} />
        </Route>
        <Route
          path="/rider-completed-deliveries"
          element={<RiderCompletedDeliveries />}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </CartProvider>
  );
}

export default App;