import {useState , useEffect} from "react";
import Sidebar from "../components/Sidebar";
import MenuHeader from "../components/MenuHeader";
import MenuForm from "../components/MenuForm";
import MenuTable from "../components/MenuTable";

function Menu() {
  const [menus, setMenus] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("menus"));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [editingMenu, setEditingMenu] = useState(null);

  useEffect(() => {
    localStorage.setItem("menus", JSON.stringify(menus));
  }, [menus]);
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6">
        <MenuHeader />
        <MenuForm menus={menus} setMenus={setMenus} editingMenu={editingMenu} setEditingMenu={setEditingMenu} />
        <MenuTable menus={menus} setMenus={setMenus} editingMenu={editingMenu} setEditingMenu={setEditingMenu} />
      </main>
    </div>
  );
}

export default Menu;