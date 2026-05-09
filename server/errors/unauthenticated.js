const { CustomAPIError } = require("./custom-error");

class UnauthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message, 401);
  }
}

module.exports = UnauthenticatedError;
