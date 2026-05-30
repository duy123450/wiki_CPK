/**
 * ProtectedRoute — auth + role guard for protected pages.
 *
 * Auth state sourced from AuthContext (not props) — eliminates the INFERRED
 * edge between App Component and Protected Route Guard flagged by graphify.
 *
 * Role checking uses canonical ROLES constant — no floating string literals.
 *
 * @param {string|null}  requiredRole  ROLES.ADMIN | ROLES.SUB_ADMIN | null (any authed user)
 * @param {string}       redirectTo    redirect path when unauthenticated (default: '/auth')
 * @param {ReactNode}    children      protected subtree
 *
 * @example
 *   // Any authenticated user
 *   <ProtectedRoute><ProfilePage /></ProtectedRoute>
 *
 *   // Admin only
 *   import { ROLES } from '../constants'
 *   <ProtectedRoute requiredRole={ROLES.ADMIN}><AdminDashboard /></ProtectedRoute>
 */
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { ROLES } from '../constants'

export default function ProtectedRoute({
  requiredRole = null,
  redirectTo = '/auth',
  children,
}) {
  const { authUser } = useAuthContext()

  // Not authenticated — redirect to login
  if (!authUser) {
    return <Navigate to={redirectTo} replace />
  }

  // Authenticated but wrong role — redirect to home
  if (requiredRole && authUser.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}

// Re-export ROLES for convenience when co-locating route config
export { ROLES }
