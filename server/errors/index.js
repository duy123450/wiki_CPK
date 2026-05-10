const Errors = require("./custom-error");

class UnauthenticatedError extends Errors.AuthError {
  constructor(message) {
    super(message || 'Unauthenticated', 401);
  }
}

class UnauthorizedError extends Errors.AuthError {
  constructor(message) {
    super(message || 'Unauthorized', 403);
  }
}

module.exports = {
  ...Errors,
  UnauthenticatedError,
  UnauthorizedError,
  SoundtrackError: Errors.WikiError,
};
