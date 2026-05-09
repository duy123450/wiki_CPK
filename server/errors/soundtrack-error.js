const { CustomAPIError } = require("./custom-error");

class SoundtrackError extends CustomAPIError {
  constructor(message, statusCode = 404) {
    super(message, statusCode);
    this.name = "SoundtrackError";
  }
}

module.exports = SoundtrackError;
