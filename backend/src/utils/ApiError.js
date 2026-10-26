'use strict';

/**
 * Operational error with an HTTP status code and optional field level errors.
 * The centralised error handler knows how to turn this into a JSON response.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = undefined, code = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }

  static unprocessable(message = 'Validation failed', errors) {
    return new ApiError(422, message, errors);
  }

  static tooMany(message = 'Too many requests') {
    return new ApiError(429, message);
  }
}

module.exports = ApiError;
