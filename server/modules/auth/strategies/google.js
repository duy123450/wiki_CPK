const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const { googleLoginUser } = require('../auth.service')

// Read directly from process.env so test files can override before requiring server
const clientId = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET
const callbackURL = process.env.GOOGLE_CALLBACK_URL || '/api/v1/wiki/auth/google/callback'

if (clientId && clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: clientId,
        clientSecret: clientSecret,
        proxy: true,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const authResult = await googleLoginUser(profile)
          return done(null, authResult)
        } catch (error) {
          return done(error, false)
        }
      }
    )
  )
}
