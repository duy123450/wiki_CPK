import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DragonCursor from "./components/DragonCursor";
import Sidebar from "./components/Sidebar";
import HeroPage from "./pages/HeroPage";
import MovieOverviewPage from "./pages/MovieOverviewPage";
import Footer from "./components/Footer";
import Playlist from "./components/Playlist";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dragonCursorEnabled, setDragonCursorEnabled] = useState(true);

  return (
    <Router>
      <>
        {dragonCursorEnabled && <DragonCursor />}
        <Sidebar
          onCollapseChange={setSidebarCollapsed}
          onDragonCursorToggle={() => setDragonCursorEnabled((v) => !v)}
          dragonCursorEnabled={dragonCursorEnabled}
        />
        <Routes>
          <Route
            path="/"
            element={<HeroPage sidebarCollapsed={sidebarCollapsed} />}
          />
          <Route
            path="/wiki/princess-kaguya"
            element={<HeroPage sidebarCollapsed={sidebarCollapsed} />}
          />
          <Route
            path="/wiki/movie-overview"
            element={<MovieOverviewPage sidebarCollapsed={sidebarCollapsed} />}
          />
        </Routes>
        <Footer sidebarCollapsed={sidebarCollapsed} />
        <Playlist />
      </>
    </Router>
  );
}
