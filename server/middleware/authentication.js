const jwt = require('jsonwebtoken')
const { timingSafeVerify } = require('../utils/security')
const { UnauthenticatedError } = require('../errors')
const envConfig = require('../config/env.config')
const redisClient = require('../config/redis')

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthenticatedError('Authentication invalid'))
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = timingSafeVerify(token, envConfig.JWT_ACCESS_SECRET)

    if (payload.jti) {
      const isBlacklisted = await redisClient.get(`blacklist:${payload.jti}`)
      if (isBlacklisted) {
        return next(new UnauthenticatedError('Token revoked or expired'))
      }
    }

    req.user = { userId: payload.userId, name: payload.name, role: payload.role, jti: payload.jti }
    next()
  } catch (error) {
    return next(new UnauthenticatedError('Authentication invalid'))
  }
}

module.exports = authenticateUser
