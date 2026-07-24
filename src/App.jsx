import { Routes, Route } from "react-router-dom";

import Login from ".//pages/Authentication/Login";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Orders from "./pages/Orders";
import CustomerHome from "./pages/CustomerHome"


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/customerhome" element={<CustomerHome/>} />
    
    </Routes>
  );
}

export default App;