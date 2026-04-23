import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import DragonCursor from "./components/DragonCursor";
import Sidebar from "./components/Sidebar";
import HeroPage from "./pages/HeroPage";
import MovieOverviewPage from "./pages/MovieOverviewPage";
import CharactersPage from "./pages/CharactersPage";
import CharacterPage from "./pages/CharacterPage";
import Footer from "./components/Footer";
import Playlist from "./components/Playlist";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dragonCursorEnabled, setDragonCursorEnabled] = useState(true);

  return (
    <Router>
      <ScrollToTop />
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
            path="/wiki/chou-kaguya-hime-overview"
            element={<MovieOverviewPage sidebarCollapsed={sidebarCollapsed} />}
          />
          <Route
            path="/wiki/characters"
            element={<CharactersPage sidebarCollapsed={sidebarCollapsed} />}
          />
          <Route
            path="/wiki/characters/:slug"
            element={<CharacterPage sidebarCollapsed={sidebarCollapsed} />}
          />
        </Routes>
        <Footer sidebarCollapsed={sidebarCollapsed} />
        <Playlist />
      </>
    </Router>
  );
}
