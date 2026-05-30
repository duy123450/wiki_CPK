/**
 * Discord OAuth strategy — lazy middleware factory.
 *
 * Registers the DiscordStrategy on first request. Handles local vs production
 * env var switching. Returns 500 if credentials are not configured.
 *
 * Usage: router.get('/discord', requireDiscordOAuthConfig, passport.authenticate('discord'))
 */
const passport = require('passport')

module.exports = function requireDiscordOAuthConfig(req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production'
  const clientId = isProduction
    ? process.env.DISCORD_PROD_CLIENT_ID || process.env.DISCORD_CLIENT_ID
    : process.env.DISCORD_CLIENT_ID
  const clientSecret = isProduction
    ? process.env.DISCORD_PROD_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET
    : process.env.DISCORD_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      msg: 'Discord OAuth not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in server/.env.',
    })
  }

  const DiscordStrategy = require('passport-discord').Strategy
  const { discordLoginUser } = require('../auth.service')
  const callbackURL = isProduction
    ? process.env.DISCORD_PROD_CALLBACK_URL
    : process.env.DISCORD_LOCAL_CALLBACK_URL ||
      `${process.env.FRONTEND_URL?.replace(':5173', ':3000') || 'http://localhost:3000'}/api/v1/wiki/auth/discord/callback`

  passport.use(
    new DiscordStrategy(
      {
        clientID: clientId,
        clientSecret,
        callbackURL,
        scope: ['identify', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          return done(null, await discordLoginUser(profile))
        } catch (error) {
          return done(error, false)
        }
      }
    )
  )

  return next()
}
