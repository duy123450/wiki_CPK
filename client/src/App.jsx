import { useState } from "react";
import DragonCursor from "./components/DragonCursor";
import Sidebar from "./components/Sidebar";
import HeroPage from "./pages/HeroPage";
import Footer from "./components/Footer";
import Playlist from "./components/Playlist";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dragonCursorEnabled, setDragonCursorEnabled] = useState(true);

  return (
    <>
      {dragonCursorEnabled && <DragonCursor />}
      <Sidebar
        onCollapseChange={setSidebarCollapsed}
        onDragonCursorToggle={() => setDragonCursorEnabled((v) => !v)}
        dragonCursorEnabled={dragonCursorEnabled}
      />
      <HeroPage sidebarCollapsed={sidebarCollapsed} />
      <Footer sidebarCollapsed={sidebarCollapsed} />
      <Playlist />
    </>
  );
}
