/**
 * GitHub OAuth strategy — lazy middleware factory.
 *
 * Registers the GitHubStrategy on first request. Handles local vs production
 * env var switching. Returns 500 if credentials are not configured.
 *
 * Usage: router.get('/github', requireGitHubOAuthConfig, passport.authenticate('github', ...))
 */
const passport = require('passport')

module.exports = function requireGitHubOAuthConfig(req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production'
  const clientId = isProduction
    ? process.env.GITHUB_PROD_CLIENT_ID
    : process.env.GITHUB_LOCAL_CLIENT_ID
  const clientSecret = isProduction
    ? process.env.GITHUB_PROD_CLIENT_SECRET
    : process.env.GITHUB_LOCAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      msg: 'GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in server/.env.',
    })
  }

  const GitHubStrategy = require('passport-github2').Strategy
  const { githubLoginUser } = require('../auth.service')
  const callbackURL = isProduction
    ? process.env.GITHUB_PROD_CALLBACK_URL
    : process.env.GITHUB_LOCAL_CALLBACK_URL ||
      `${process.env.FRONTEND_URL?.replace(':5173', ':3000') || 'http://localhost:3000'}/api/v1/wiki/auth/github/callback`

  passport.use(
    new GitHubStrategy(
      {
        clientID: clientId,
        clientSecret,
        callbackURL,
        scope: ['user:email'],
        customHeaders: {
          'User-Agent': 'Wiki-CPK-App',
        },
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          return done(null, await githubLoginUser(profile))
        } catch (error) {
          return done(error, false)
        }
      }
    )
  )

  return next()
}
