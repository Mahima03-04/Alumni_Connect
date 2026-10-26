'use strict';

const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { verifyAuthToken } = require('../utils/tokens');

/**
 * Resolve the authenticated user from (in order of preference):
 *   1. the httpOnly auth cookie
 *   2. an `Authorization: Bearer <token>` header
 * Returns null when no valid credentials are present.
 */
async function resolveUserFromRequest(req) {
  let token = null;

  if (req.cookies && req.cookies[env.jwt.cookieName]) {
    token = req.cookies[env.jwt.cookieName];
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7).trim();
  }

  if (!token) return null;

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (error) {
    return null; // expired or tampered token -> treated as anonymous
  }

  const user = await User.findById(payload.sub);
  if (!user) return null;
  return user;
}

/**
 * Require a valid session. Rejects when the account is disabled, or when an
 * alumnus has been rejected by an administrator.
 */
const protect = async (req, res, next) => {
  const user = await resolveUserFromRequest(req);

  if (!user) {
    return next(ApiError.unauthorized('Please log in to continue.'));
  }
  if (user.accountStatus === 'suspended') {
    return next(ApiError.forbidden('Your account has been suspended. Please contact the administrator.'));
  }
  if (user.accountStatus === 'inactive') {
    return next(ApiError.forbidden('Your account is inactive. Please contact the administrator.'));
  }
  if (user.role === 'alumni' && user.approvalStatus === 'rejected') {
    return next(ApiError.forbidden('Your alumni registration was rejected. Please contact the administrator.'));
  }

  req.user = user;
  return next();
};

/** Attach req.user when a valid token exists, but never reject the request. */
const optionalAuth = async (req, _res, next) => {
  try {
    const user = await resolveUserFromRequest(req);
    if (user && user.accountStatus === 'active') req.user = user;
  } catch (error) {
    // ignore - optional auth must never fail the request
  }
  return next();
};

/** Restrict a route to one or more roles. */
const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to access this resource.'));
    }
    return next();
  };

/**
 * Alumni must be approved before they can take part in restricted actions
 * (posting jobs, responding to mentorship requests, etc).
 */
const requireApprovedAlumni = (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.role !== 'alumni') {
    return next(ApiError.forbidden('This action is available to alumni accounts only.'));
  }
  if (req.user.approvalStatus !== 'approved') {
    return next(
      ApiError.forbidden(
        'Your alumni account is awaiting administrator approval. You will be notified once it is reviewed.'
      )
    );
  }
  return next();
};

/** Only the owner of a document (or an admin) may continue. */
const requireOwnerOrAdmin = (getOwnerId) => async (req, _res, next) => {
  try {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role === 'admin') return next();
    const ownerId = await getOwnerId(req);
    if (!ownerId) return next(ApiError.notFound('Resource not found.'));
    if (String(ownerId) !== String(req.user._id)) {
      return next(ApiError.forbidden('You do not have permission to modify this resource.'));
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  requireApprovedAlumni,
  requireOwnerOrAdmin,
  resolveUserFromRequest,
};
