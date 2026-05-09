const { CustomAPIError } = require("./custom-error");

class ValidationError extends CustomAPIError {
  constructor(message, statusCode = 400) {
    super(message, statusCode);
    this.name = "ValidationError";
  }
}

module.exports = ValidationError;
