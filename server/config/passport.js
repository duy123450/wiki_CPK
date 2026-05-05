const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const TwitterStrategy = require("passport-twitter-oauth2").Strategy;
const User = require("../models/user.model");
const { googleLoginUser, twitterLoginUser } = require("../services/auth.service");

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

// Twitter OAuth2 strategy (X API v2)
const isProduction = process.env.NODE_ENV === "production";
const clientId = isProduction
  ? process.env.X_PROD_CLIENT_ID
  : process.env.X_LOCAL_CLIENT_ID;
const clientSecret = isProduction
  ? process.env.X_PROD_CLIENT_SECRET
  : process.env.X_LOCAL_CLIENT_SECRET;
const callbackURL = isProduction
  ? process.env.X_PROD_CALLBACK_URL
  : `${process.env.FRONTEND_URL?.replace(':5173', ':3000') || 'http://localhost:3000'}/api/v1/wiki/auth/x/callback`;

if (clientId && clientSecret) {
  passport.use(
    'twitter',
    new TwitterStrategy(
      {
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: callbackURL,
        authorizationURL: "https://twitter.com/i/oauth2/authorize",
        tokenURL: "https://api.twitter.com/2/oauth2/token",
        userProfileURL: "https://api.twitter.com/2/users/me",
        includeEmail: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("\n🔐 TWITTER STRATEGY VERIFY CALLED");
          console.log("Profile ID:", profile?.id);
          const authResult = await twitterLoginUser(profile);
          console.log("✅ Auth result generated");
          return done(null, authResult);
        } catch (error) {
          console.error("❌ Twitter verify error:", error.message);
          return done(error, false);
        }
      },
    ),
  );
}

// Session serialization
passport.serializeUser((user, done) => {
  done(null, user.userId || user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("Deserializing user with ID:", id);
    const user = await User.findById(id).select(
      "_id username role email avatar",
    );
    if (!user) {
      console.log("User not found for ID:", id);
      return done(null, false);
    }
    const userData = {
      userId: user._id.toString(),
      name: user.username,
      role: user.role,
      email: user.email,
      avatar: user.avatar,
    };
    console.log("User deserialized successfully:", userData);
    done(null, userData);
  } catch (error) {
    console.error("Deserialization error:", error);
    done(error, false);
  }
});

module.exports = passport;
