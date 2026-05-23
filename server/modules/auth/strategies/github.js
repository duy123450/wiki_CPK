const passport = require('passport')
const GitHubStrategy = require('passport-github2').Strategy
const { githubLoginUser } = require('../auth.service')
const envConfig = require('../../config/env.config')

const isProduction = envConfig.NODE_ENV === 'production'

// Automatically switch between local and production environment variables
const githubClientId = isProduction
  ? envConfig.GITHUB_PROD_CLIENT_ID
  : envConfig.GITHUB_LOCAL_CLIENT_ID

const githubClientSecret = isProduction
  ? envConfig.GITHUB_PROD_CLIENT_SECRET
  : envConfig.GITHUB_LOCAL_CLIENT_SECRET

const githubCallbackURL = isProduction
  ? envConfig.GITHUB_PROD_CALLBACK_URL
  : envConfig.GITHUB_LOCAL_CALLBACK_URL ||
  `${envConfig.FRONTEND_URL?.replace(':5173', ':3000') || 'http://localhost:3000'}/api/v1/wiki/auth/github/callback`

if (githubClientId && githubClientSecret) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: githubClientId,
        clientSecret: githubClientSecret,
        callbackURL: githubCallbackURL,
        scope: ['user:email'],
        customHeaders: {
          'User-Agent': 'Wiki-CPK-App',
        },
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const authResult = await githubLoginUser(profile)
          return done(null, authResult)
        } catch (error) {
          return done(error, false)
        }
      }
    )
  )
}
