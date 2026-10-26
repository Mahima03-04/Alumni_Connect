'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

/** Sign a JWT that identifies a user and their role. */
function signAuthToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

function verifyAuthToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Cookie options for the auth token. `sameSite: lax` blocks cross-site
 * POST requests from automatically carrying the cookie, which complements the
 * double-submit CSRF token.
 */
function authCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function csrfCookieOptions() {
  return {
    httpOnly: false, // must be readable by the browser to copy into a header
    secure: env.cookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 60 * 60 * 1000,
  };
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
  randomToken,
  authCookieOptions,
  csrfCookieOptions,
};
