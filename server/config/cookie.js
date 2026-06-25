const envConfig = require('./env.config')

const isProd = envConfig.NODE_ENV === 'production'

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/v1/wiki/auth',
}

module.exports = {
  refreshCookieOptions,
}
