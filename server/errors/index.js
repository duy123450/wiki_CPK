const { CustomAPIError } = require("./custom-error");
const BadRequestError = require("./bad-request");
const NotFoundError = require("./not-found");
const UnauthenticatedError = require("./unauthenticated");
const UnauthorizedError = require("./unauthorized");
const AuthError = require("./auth-error");
const WikiError = require("./wiki-error");
const ValidationError = require("./validation-error");
const SoundtrackError = require("./soundtrack-error");

module.exports = {
  CustomAPIError,
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
  AuthError,
  WikiError,
  ValidationError,
  SoundtrackError,
};
