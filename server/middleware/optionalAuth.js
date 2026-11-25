const jwt = require('jsonwebtoken')
const { timingSafeVerify } = require('../utils/security')
const envConfig = require('../config/env.config')
const redisClient = require('../config/redis')

const optionalAuth = async (req, _res, next) => {
  delete req.user

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = timingSafeVerify(token, envConfig.JWT_ACCESS_SECRET)
    if (
      typeof payload.jti !== 'string' ||
      !payload.jti ||
      payload.jti.length > 128 ||
      /\s|[\x00-\x1F\x7F]/.test(payload.jti)
    ) {
      return next()
    }

    const isBlacklisted = await redisClient.get(`blacklist:${payload.jti}`)
    if (isBlacklisted) {
      return next()
    }
    req.user = {
      userId: payload.userId,
      name: payload.name,
      role: payload.role,
      jti: payload.jti,
      exp: payload.exp,
    }
  } catch {
    // Invalid token — treat as unauthenticated guest; do not error out.
  }

  return next()
}

module.exports = optionalAuth
