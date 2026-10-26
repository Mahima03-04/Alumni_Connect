'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs after express-validator chains. Converts the collected errors into our
 * consistent error envelope with per-field messages.
 */
function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
  }));

  return next(ApiError.unprocessable('Please correct the highlighted fields.', errors));
}

module.exports = validate;
