const passport = require("../config/passport");
const { createCustomError } = require("../errors/custom-error");

const authenticateUser = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (error, user) => {
    if (error) {
      return next(error);
    }

    if (!user) {
      return next(createCustomError("Authentication invalid", 401));
    }

    req.user = user;
    next();
  })(req, res, next);
};

module.exports = authenticateUser;
