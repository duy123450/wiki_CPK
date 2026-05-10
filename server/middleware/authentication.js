const passport = require("../config/passport");
const { UnauthenticatedError } = require("../errors");

const authenticateUser = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (error, user) => {
    if (error) {
      return next(error);
    }

    if (!user) {
      return next(new UnauthenticatedError("Authentication invalid"));
    }


    req.user = user;
    next();
  })(req, res, next);
};

module.exports = authenticateUser;
