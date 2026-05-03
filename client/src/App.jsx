import { useCallback, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import DragonCursor from "./components/DragonCursor";
import Sidebar from "./components/Sidebar";
import HeroPage from "./pages/HeroPage";
import MovieOverviewPage from "./pages/MovieOverviewPage";
import CharactersPage from "./pages/CharactersPage";
import CharacterPage from "./pages/CharacterPage";
import NotFoundPage from "./pages/NotFoundPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import Footer from "./components/Footer";
import Playlist from "./components/Playlist";
import { AUTH_TOKEN_KEY, getCurrentUser } from "./services/api";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dragonCursorEnabled, setDragonCursorEnabled] = useState(true);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const restoreUser = async () => {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;
      try {
        const user = await getCurrentUser();
        setAuthUser(user);
      } catch {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    };
    restoreUser();
  }, []);

  // Called on login / register — response is { user, token }
  const handleAuthSuccess = useCallback(({ user, token }) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    setAuthUser(user);
  }, []);

  // Called when only the avatar changes — no token resave needed
  const handleAvatarUpdate = useCallback((avatar) => {
    setAuthUser((prev) => (prev ? { ...prev, avatar } : prev));
  }, []);

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    setAuthUser(null);
  }, []);

  // Called when profile fields (username, email) are updated
  const handleProfileUpdate = useCallback((user, token) => {
    if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    setAuthUser(user);
  }, []);

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
              <ProfilePage
                sidebarCollapsed={sidebarCollapsed}
                currentUser={authUser}
                onProfileUpdate={handleProfileUpdate}
                onAvatarUpdate={handleAvatarUpdate}
                onLogout={handleLogout}
              />
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
