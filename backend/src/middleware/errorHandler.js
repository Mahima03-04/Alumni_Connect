'use strict';

const ApiError = require('../utils/ApiError');
const { sendError } = require('../utils/apiResponse');
const env = require('../config/env');

/** 404 handler for unmatched routes. */
function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Centralised error handler. Maps mongoose / multer / jwt errors onto our
 * consistent JSON error envelope and never leaks stack traces in production.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';
  let errors = err.errors;
  let code = err.code;

  // Invalid ObjectId
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}.`;
  }

  // Mongoose validation
  if (err.name === 'ValidationError' && err.errors) {
    status = 422;
    message = 'Please correct the highlighted fields.';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Duplicate key
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `A record with this ${field} already exists${value ? ` (${value})` : ''}.`;
    errors = [{ field, message }];
  }

  // Multer upload errors
  if (err.name === 'MulterError') {
    status = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `The uploaded file is too large. Maximum size is ${env.maxUploadMb} MB.`
        : `File upload error: ${err.message}`;
  }

  // JSON body parse error
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON.';
  }

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
    if (env.isProduction) message = 'An unexpected error occurred.';
  }

  return sendError(res, { status, message, errors, code });
}

/** Wrap the 404 + error handlers so tests can exercise them directly. */
function notFoundHandler() {
  return notFound;
}

module.exports = { notFound, notFoundHandler, errorHandler };
