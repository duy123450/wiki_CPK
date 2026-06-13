const jwt = require('jsonwebtoken')
const { timingSafeVerify } = require('../utils/security')
const { UnauthenticatedError } = require('../errors')
const envConfig = require('../config/env.config')

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthenticatedError('Authentication invalid'))
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = timingSafeVerify(token, envConfig.JWT_ACCESS_SECRET)
    req.user = { userId: payload.userId, name: payload.name, role: payload.role }
    next()
  } catch (error) {
    return next(new UnauthenticatedError('Authentication invalid'))
  }
}

module.exports = authenticateUser
