/**
 * Twitter/X OAuth strategy — lazy middleware factory.
 *
 * Registers the TwitterStrategy on first request. Handles local vs production
 * env var switching. Returns 500 if credentials are not configured.
 *
 * Usage: router.get('/x', requireTwitterOAuthConfig, passport.authenticate('twitter', ...))
 */
const passport = require('passport')

module.exports = function requireTwitterOAuthConfig(req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production'
  const clientId = isProduction
    ? process.env.X_PROD_CLIENT_ID || process.env.X_CLIENT_ID
    : process.env.X_LOCAL_CLIENT_ID || process.env.X_CLIENT_ID
  const clientSecret = isProduction
    ? process.env.X_PROD_CLIENT_SECRET || process.env.X_CLIENT_SECRET
    : process.env.X_LOCAL_CLIENT_SECRET || process.env.X_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      msg: 'Twitter OAuth is not configured',
    })
  }

  const TwitterStrategy = require('passport-twitter-oauth2').Strategy
  const { twitterLoginUser } = require('../auth.service')
  const callbackURL = isProduction
    ? process.env.X_PROD_CALLBACK_URL
    : `${process.env.FRONTEND_URL?.replace(':5173', ':3000') || 'http://localhost:3000'}/api/v1/wiki/auth/x/callback`

  const twitterStrategy = new TwitterStrategy(
    {
      clientID: clientId,
      clientSecret,
      clientType: 'confidential',
      callbackURL,
      authorizationURL: 'https://twitter.com/i/oauth2/authorize',
      tokenURL: 'https://api.twitter.com/2/oauth2/token',
      userProfileURL: 'https://api.twitter.com/2/users/me',
      includeEmail: true,
      pkce: true,
      state: true,
      scopeSeparator: ' ',
      customHeaders: {
        Authorization:
          'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        return done(null, await twitterLoginUser(profile))
      } catch (error) {
        return done(error, false)
      }
    }
  )

  // Custom userProfile override — Twitter v2 API (no standard profile endpoint)
  twitterStrategy.userProfile = async function (accessToken, params, done) {
    if (typeof params === 'function') {
      done = params
      params = {}
    }
    try {
      const axios = require('axios')
      const response = await axios.get(
        'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const data = response.data
      done(null, {
        provider: 'twitter',
        id: data.data.id,
        username: data.data.username,
        displayName: data.data.name,
        photos: data.data.profile_image_url
          ? [{ value: data.data.profile_image_url }]
          : [],
        _raw: JSON.stringify(data),
        _json: data,
      })
    } catch (error) {
      done(error)
    }
  }

  passport.use('twitter', twitterStrategy)
  return next()
}
