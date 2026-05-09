import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import DragonCursor from "./components/DragonCursor";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import HeroPage from "./pages/HeroPage";
import MovieOverviewPage from "./pages/MovieOverviewPage";
import CharactersPage from "./pages/CharactersPage";
import CharacterPage from "./pages/CharacterPage";
import NotFoundPage from "./pages/NotFoundPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import Footer from "./components/Footer";
import Playlist from "./components/Playlist";
import useAuth from "./hooks/useAuth";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dragonCursorEnabled, setDragonCursorEnabled] = useState(true);
  const {
    authUser,
    handleAuthSuccess,
    handleAvatarUpdate,
    handleLogout,
    handleProfileUpdate,
  } = useAuth();

  return (
    <Router>
      <ScrollToTop />
      <>
        {dragonCursorEnabled && <DragonCursor />}
        <Sidebar
          onCollapseChange={setSidebarCollapsed}
          onDragonCursorToggle={() => setDragonCursorEnabled((v) => !v)}
          dragonCursorEnabled={dragonCursorEnabled}
          currentUser={authUser}
          onLogout={handleLogout}
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
          <Route
            path="/auth"
            element={
              <AuthPage
                sidebarCollapsed={sidebarCollapsed}
                currentUser={authUser}
                onAuthSuccess={handleAuthSuccess}
                onAvatarUpdate={handleAvatarUpdate}
                onLogout={handleLogout}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute currentUser={authUser}>
                <ProfilePage
                  sidebarCollapsed={sidebarCollapsed}
                  currentUser={authUser}
                  onProfileUpdate={handleProfileUpdate}
                  onAvatarUpdate={handleAvatarUpdate}
                  onLogout={handleLogout}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<NotFoundPage sidebarCollapsed={sidebarCollapsed} />}
          />
        </Routes>
        <Footer sidebarCollapsed={sidebarCollapsed} />
        <Playlist />
      </>
    </Router>
  );
}
