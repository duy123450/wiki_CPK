/**
 * App — root component.
 *
 * Auth state is sourced once via useAuth() and provided to the entire
 * tree via AuthContext.Provider. Sidebar and ProtectedRoute consume it
 * internally — no prop-drilling of currentUser / onLogout below this level.
 *
 * Explicit dependency graph (previously flagged as INFERRED by graphify):
 *   App → AuthContext.Provider        (EXTRACTED: direct import + usage)
 *   Sidebar → useAuthContext()        (EXTRACTED: reads from context)
 *   ProtectedRoute → useAuthContext() (EXTRACTED: reads from context)
 */
import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthContext } from './context/AuthContext'
import ScrollToTop        from './components/ScrollToTop'
import DragonCursor       from './components/DragonCursor'
import Sidebar            from './components/Sidebar'
import ProtectedRoute     from './components/ProtectedRoute'
import HeroPage           from './pages/HeroPage'
import MovieOverviewPage  from './pages/MovieOverviewPage'
import CharactersPage     from './pages/CharactersPage'
import CharacterPage      from './pages/CharacterPage'
import NotFoundPage       from './pages/NotFoundPage'
import AuthPage           from './pages/AuthPage'
import WelcomePage        from './pages/WelcomePage'
import ProfilePage        from './pages/ProfilePage'
import Footer             from './components/Footer'
import Playlist           from './components/Playlist'
import useAuth            from './hooks/useAuth'

export default function App() {
  const [sidebarCollapsed,    setSidebarCollapsed]    = useState(false)
  const [dragonCursorEnabled, setDragonCursorEnabled] = useState(true)

  // Single auth hook — all state in one place, passed to context
  const authState = useAuth()
  const { authUser } = authState

  return (
    // AuthContext.Provider makes auth state explicitly available tree-wide.
    // Eliminates implicit prop-chain coupling flagged as INFERRED edges.
    <AuthContext.Provider value={authState}>
      <Router>
        <ScrollToTop />
        <>
          {dragonCursorEnabled && <DragonCursor />}

          {/*
            Sidebar reads currentUser + onLogout from AuthContext internally.
            Only UI-concern props passed here — collapseChange, cursor toggle.
          */}
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

            {/*
              AuthPage still receives currentUser for its own redirect logic
              and the auth callback handlers as explicit props.
            */}
            <Route
              path="/auth"
              element={
                <AuthPage
                  sidebarCollapsed={sidebarCollapsed}
                  currentUser={authUser}
                  onAuthSuccess={authState.handleAuthSuccess}
                  onAvatarUpdate={authState.handleAvatarUpdate}
                  onLogout={authState.handleLogout}
                />
              }
            />

            <Route
              path="/welcome"
              element={
                <WelcomePage
                  sidebarCollapsed={sidebarCollapsed}
                  currentUser={authUser}
                  onAvatarUpdate={authState.handleAvatarUpdate}
                  onLogout={authState.handleLogout}
                />
              }
            />

            {/*
              ProtectedRoute reads authUser from AuthContext — no currentUser prop.
              requiredRole=null means any authenticated user can access.
            */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute requiredRole={null}>
                  <ProfilePage
                    sidebarCollapsed={sidebarCollapsed}
                    currentUser={authUser}
                    onProfileUpdate={authState.handleProfileUpdate}
                    onAvatarUpdate={authState.handleAvatarUpdate}
                    onLogout={authState.handleLogout}
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
    </AuthContext.Provider>
  )
}
