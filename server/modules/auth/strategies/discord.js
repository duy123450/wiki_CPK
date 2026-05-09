const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const { discordLoginUser } = require("../auth.service");

const isProduction = process.env.NODE_ENV === "production";
const discordClientId = isProduction
  ? process.env.DISCORD_PROD_CLIENT_ID
  : process.env.DISCORD_CLIENT_ID;
const discordClientSecret = isProduction
  ? process.env.DISCORD_PROD_CLIENT_SECRET
  : process.env.DISCORD_CLIENT_SECRET;
const discordCallbackURL = isProduction
  ? process.env.DISCORD_PROD_CALLBACK_URL
  : process.env.DISCORD_LOCAL_CALLBACK_URL || `${process.env.FRONTEND_URL?.replace(':5173', ':3000') || 'http://localhost:3000'}/api/v1/wiki/auth/discord/callback`;

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
          const authResult = await discordLoginUser(profile);
          return done(null, authResult);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
}
