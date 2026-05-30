/**
 * Role-based authorization middleware factory.
 *
 * Uses canonical ROLES from server/constants/roles.js — no floating strings.
 *
 * @example
 *   const { authorizeRoles, ROLES } = require('../../middleware/authorizeRoles')
 *   router.delete('/admin/user/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), handler)
 */
const { ROLES } = require('../constants/roles')

/**
 * Returns Express middleware that restricts a route to the given roles.
 * Assumes `authenticateUser` middleware has already populated `req.user`.
 *
 * @param {...string} allowedRoles - One or more ROLES values
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: 'Unauthenticated' })
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Insufficient permissions' })
    }
    return next()
  }
}

module.exports = { authorizeRoles, ROLES }
