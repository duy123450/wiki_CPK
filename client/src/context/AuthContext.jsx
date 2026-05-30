/**
 * AuthContext — single source of truth for auth state across the component tree.
 *
 * Replaces implicit prop-threading of `currentUser` / `onLogout` / etc.
 * Eliminates the 2 INFERRED edges flagged by graphify on App Component:
 *   - App → Sidebar Navigation Component (previously via currentUser prop)
 *   - App → Protected Route Guard (previously via currentUser prop)
 *
 * Pattern:
 *   1. App wraps the tree in <AuthContext.Provider value={authState}>
 *   2. Sidebar / ProtectedRoute / any consumer calls useAuthContext()
 *   3. No prop-drilling for auth data below App level
 */
import { createContext, useContext } from 'react'

/**
 * Auth context shape — explicit contract, no implicit side-effects.
 * Defaults are no-ops so consumers never crash during initial render.
 */
export const AuthContext = createContext({
  authUser: null,
  handleAuthSuccess:  () => {},
  handleAvatarUpdate: () => {},
  handleLogout:       () => {},
  handleProfileUpdate: () => {},
})

/**
 * Hook: read auth state from context.
 * Use inside any component that needs auth — no prop required.
 *
 * @returns {{ authUser, handleAuthSuccess, handleAvatarUpdate, handleLogout, handleProfileUpdate }}
 */
export function useAuthContext() {
  return useContext(AuthContext)
}
