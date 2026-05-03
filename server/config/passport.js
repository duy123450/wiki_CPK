const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user.model");
const { googleLoginUser } = require("../services/auth.service");

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_ACCESS_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.userId).select(
        "_id username role email avatar",
      );

      if (!user) {
        return done(null, false);
      }

      return done(null, {
        userId: user._id.toString(),
        name: user.username,
        role: user.role,
        email: user.email,
        avatar: user.avatar,
      });
    } catch (error) {
      return done(error, false);
    }
  }),
);

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
        proxy: true,
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

module.exports = passport;
