/**
 * Google OAuth strategy — lazy middleware factory.
 *
 * Registers the GoogleStrategy on first request. Returns 500 if
 * GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not configured.
 *
 * Usage: router.get('/google', requireGoogleOAuthConfig, passport.authenticate('google', ...))
 */
const passport = require('passport')

module.exports = function requireGoogleOAuthConfig(req, res, next) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      msg: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env.',
    })
  }

  const GoogleStrategy = require('passport-google-oauth20').Strategy
  const { googleLoginUser } = require('../auth.service')
  const callbackURL =
    process.env.GOOGLE_CALLBACK_URL || '/api/v1/wiki/auth/google/callback'

  passport.use(
    new GoogleStrategy(
      { clientID: clientId, clientSecret, proxy: true, callbackURL },
      async (accessToken, refreshToken, profile, done) => {
        try {
          return done(null, await googleLoginUser(profile))
        } catch (error) {
          return done(error, false)
        }
      }
    )
  )

  return next()
}
