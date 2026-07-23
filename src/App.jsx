import { Routes, Route } from "react-router-dom";

import Login from ".//pages/Authentication/Login";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Orders from "./pages/Orders";
import Home from "./pages/Home";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/home" element={<Home />} />
    
    </Routes>
  );
}

export default App;