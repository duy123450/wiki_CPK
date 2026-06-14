const jwt = require('jsonwebtoken')
const { timingSafeVerify } = require('../utils/security')
const envConfig = require('../config/env.config')

const optionalAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = timingSafeVerify(token, envConfig.JWT_ACCESS_SECRET)
    req.user = { userId: payload.userId, name: payload.name, role: payload.role }
  } catch {
    // Invalid token — treat as unauthenticated guest; do not error out.
  }

  return next()
}

module.exports = optionalAuth
