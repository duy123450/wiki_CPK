const { CustomAPIError } = require("./custom-error");

class AuthError extends CustomAPIError {
  constructor(message, statusCode = 401) {
    super(message, statusCode);
    this.name = "AuthError";
  }
}

module.exports = AuthError;
