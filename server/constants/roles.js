/**
 * Canonical user role definitions — single source of truth.
 *
 * Import this everywhere roles are checked or assigned.
 * Never hardcode 'admin' / 'sub_admin' / 'user' strings directly.
 *
 * @example
 *   const { ROLES } = require('../../constants/roles')
 *   role: { type: String, enum: Object.values(ROLES), default: ROLES.USER }
 */
const ROLES = Object.freeze({
  ADMIN:     'admin',
  SUB_ADMIN: 'sub_admin',
  USER:      'user',
})

module.exports = { ROLES }
