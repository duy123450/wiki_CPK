const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const User = require("../models/user.model");

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
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

module.exports = passport;
