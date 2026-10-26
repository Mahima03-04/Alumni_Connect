'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

function buildLimiter({ windowMs, max, message }) {
  if (!env.rateLimit.enabled) {
    // No-op middleware during automated tests.
    return (req, res, next) => next();
  }
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    // Disable validation warnings for the local host setup.
    validate: { xForwardedForHeader: false },
    message: { success: false, message },
  });
}

const globalLimiter = buildLimiter({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  message: 'Too many requests. Please slow down and try again shortly.',
});

const authLimiter = buildLimiter({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  message: 'Too many authentication attempts. Please wait and try again.',
});

module.exports = { globalLimiter, authLimiter };
