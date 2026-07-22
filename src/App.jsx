import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Orders from "./pages/Orders";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;