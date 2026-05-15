const passport = require("passport");
const User = require("../modules/auth/user.model");

// Strategies
require("../modules/auth/strategies/jwt");
require("../modules/auth/strategies/google");
require("../modules/auth/strategies/twitter");
require("../modules/auth/strategies/discord");
require("../modules/auth/strategies/github");

// Session serialization
passport.serializeUser((user, done) => {
  const id = user?.user?.id || user?.user?._id || user?.userId || user?.id || user?._id;
  done(null, id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select(
      "_id username role email avatar",
    );
    if (!user) {
      return done(null, false);
    }
    const userData = {
      userId: user._id.toString(),
      name: user.username,
      role: user.role,
      email: user.email,
      avatar: user.avatar,
    };
    done(null, userData);
  } catch (error) {
    done(error, false);
  }
});

module.exports = passport;
