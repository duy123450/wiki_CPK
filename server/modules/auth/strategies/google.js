const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const { googleLoginUser } = require('../auth.service')
const envConfig = require('../../config/env.config')

if (envConfig.GOOGLE_CLIENT_ID && envConfig.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: envConfig.GOOGLE_CLIENT_ID,
        clientSecret: envConfig.GOOGLE_CLIENT_SECRET,
        proxy: true,
        callbackURL:
          envConfig.GOOGLE_CALLBACK_URL ||
          '/api/v1/wiki/auth/google/callback',
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
