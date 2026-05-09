const { CustomAPIError } = require("./custom-error");

class WikiError extends CustomAPIError {
  constructor(message, statusCode = 404) {
    super(message, statusCode);
    this.name = "WikiError";
  }
}

module.exports = WikiError;
