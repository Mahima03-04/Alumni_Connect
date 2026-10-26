'use strict';

const { randomToken, csrfCookieOptions } = require('../utils/tokens');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const CSRF_COOKIE = 'ac_csrf';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const EXEMPT_PATHS = ['/api/v1/auth/csrf'];

/** Ensure a CSRF cookie exists on the response so the browser can read it. */
function issueCsrfToken(req, res, next) {
  let token = req.cookies ? req.cookies[CSRF_COOKIE] : null;
  if (!token) {
    token = randomToken(24);
    res.cookie(CSRF_COOKIE, token, csrfCookieOptions());
  }
  req.csrfToken = token;
  return next();
}

/** Return the current CSRF token to the client. */
function getCsrfToken(req, res) {
  return res.status(200).json({
    success: true,
    message: 'CSRF token issued.',
    data: { csrfToken: req.csrfToken, header: CSRF_HEADER },
  });
}

/**
 * Double-submit CSRF check: the value in the readable cookie must match the
 * value in the request header for every state-changing request.
 */
function csrfProtection(req, res, next) {
  if (!env.csrfEnabled) return next();
  if (SAFE_METHODS.includes(req.method)) return next();
  if (EXEMPT_PATHS.some((p) => req.originalUrl.startsWith(p))) return next();

  const cookieToken = req.cookies ? req.cookies[CSRF_COOKIE] : null;
  const headerToken = req.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(
      new ApiError(403, 'Invalid or missing CSRF token. Please refresh the page and try again.', undefined, 'CSRF_INVALID')
    );
  }
  return next();
}

module.exports = {
  CSRF_COOKIE,
  CSRF_HEADER,
  issueCsrfToken,
  getCsrfToken,
  csrfProtection,
};
