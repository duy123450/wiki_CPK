import { useState } from "react";
import DragonCursor from "./components/DragonCursor";
import Sidebar from "./components/Sidebar";
import HeroPage from "./pages/HeroPage";
import Footer from "./components/Footer";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <>
      <DragonCursor />
      <Sidebar onCollapseChange={setSidebarCollapsed} />
      <HeroPage sidebarCollapsed={sidebarCollapsed} />
      <Footer sidebarCollapsed={sidebarCollapsed} />
    </>
  );
}