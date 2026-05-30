/**
 * Canonical user role definitions — frontend mirror of server/constants/roles.js.
 *
 * Import from this file everywhere role strings are used in components.
 * Never hardcode 'admin' / 'sub_admin' / 'user' directly.
 *
 * @example
 *   import { ROLES } from '../constants'
 *   {authUser?.role === ROLES.ADMIN && <AdminPanel />}
 *   <ProtectedRoute requiredRole={ROLES.ADMIN}>...</ProtectedRoute>
 */
export const ROLES = Object.freeze({
  ADMIN:     'admin',
  SUB_ADMIN: 'sub_admin',
  USER:      'user',
})
