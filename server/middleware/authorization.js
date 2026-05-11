const { UnauthorizedError } = require("../errors");

const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new UnauthorizedError(
        "Unauthorized to access this route"
      );
    }
    next();
  };
};

module.exports = authorizePermissions;
