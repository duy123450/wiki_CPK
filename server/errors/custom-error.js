class CustomAPIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

class AuthError extends CustomAPIError {
  constructor(message, statusCode = 401) {
    super(message, statusCode);
  }
}

class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends CustomAPIError {
  constructor(message) {
    super(message, 404);
  }
}

class ValidationError extends CustomAPIError {
  constructor(message) {
    super(message, 400);
  }
}

class WikiError extends CustomAPIError {
  constructor(message, statusCode = 500) {
    super(message, statusCode);
  }
}

module.exports = {
  CustomAPIError,
  AuthError,
  BadRequestError,
  NotFoundError,
  ValidationError,
  WikiError,
};