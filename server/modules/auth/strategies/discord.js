const passport = require('passport')
const DiscordStrategy = require('passport-discord').Strategy
const { discordLoginUser } = require('../auth.service')
const envConfig = require('../../../config/env.config')

const isProduction = envConfig.NODE_ENV === 'production'
const discordClientId = isProduction
  ? envConfig.DISCORD_PROD_CLIENT_ID || envConfig.DISCORD_CLIENT_ID
  : envConfig.DISCORD_CLIENT_ID
const discordClientSecret = isProduction
  ? envConfig.DISCORD_PROD_CLIENT_SECRET || envConfig.DISCORD_CLIENT_SECRET
  : envConfig.DISCORD_CLIENT_SECRET
const discordCallbackURL = isProduction
  ? envConfig.DISCORD_PROD_CALLBACK_URL
  : envConfig.DISCORD_LOCAL_CALLBACK_URL ||
  `${envConfig.FRONTEND_URL?.replace(':5173', ':3000') || 'http://localhost:3000'}/api/v1/wiki/auth/discord/callback`

if (discordClientId && discordClientSecret) {
  passport.use(
    new DiscordStrategy(
      {
        clientID: discordClientId,
        clientSecret: discordClientSecret,
        callbackURL: discordCallbackURL,
        scope: ['identify', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const authResult = await discordLoginUser(profile)
          return done(null, authResult)
        } catch (error) {
          return done(error, false)
        }
      }
    )
  )
}
