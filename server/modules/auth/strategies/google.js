const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { googleLoginUser } = require("../auth.service");

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        proxy: true,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "/api/v1/wiki/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const authResult = await googleLoginUser(profile);
          return done(null, authResult);
        } catch (error) {
          return done(error, false);
        }
      },
    ),
  );
}
