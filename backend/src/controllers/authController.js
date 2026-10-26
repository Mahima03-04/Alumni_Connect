'use strict';

const crypto = require('crypto');
const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');
const StudentProfile = require('../models/StudentProfile');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { signAuthToken, authCookieOptions, randomToken } = require('../utils/tokens');
const env = require('../config/env');
const { createBulkNotifications, createNotification } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');
const { computeAlumniCompletion } = require('../utils/profileCompletion');

function setAuthCookie(res, token) {
  res.cookie(env.jwt.cookieName, token, authCookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(env.jwt.cookieName, { ...authCookieOptions(), maxAge: undefined });
}

/** Build the `me` payload: the user plus their role specific profile. */
async function buildMePayload(user) {
  const base = { user: user.toJSON() };
  if (user.role === 'alumni') {
    let profile = await AlumniProfile.findOne({ user: user._id });
    if (!profile) profile = await AlumniProfile.create({ user: user._id });
    const completion = computeAlumniCompletion(profile.toObject(), user);
    if (profile.profileCompletion !== completion) {
      profile.profileCompletion = completion;
      await profile.save();
    }
    base.profile = profile.toObject();
    base.profile.profileCompletion = completion;
  } else if (user.role === 'student') {
    let profile = await StudentProfile.findOne({ user: user._id });
    if (!profile) profile = await StudentProfile.create({ user: user._id });
    base.profile = profile.toObject();
  }
  return base;
}

/**
 * POST /api/v1/auth/register
 * Students are active immediately. Alumni start in `pending` approval and are
 * restricted until an administrator approves them.
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'student', phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email address already exists.');
  }

  const passwordHash = await User.hashPassword(password);
  const isAlumni = role === 'alumni';

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: isAlumni ? 'alumni' : 'student',
    phone: phone || null,
    accountStatus: 'active',
    approvalStatus: isAlumni ? 'pending' : 'not_required',
  });

  if (isAlumni) {
    await AlumniProfile.create({ user: user._id });
  } else {
    await StudentProfile.create({ user: user._id });
  }

  await logActivity({
    actor: user,
    action: 'user.register',
    entity: 'User',
    entityId: user._id,
    description: `${user.name} registered as ${user.role}.`,
  });

  if (isAlumni) {
    // Tell every administrator there is a new approval request.
    const admins = await User.find({ role: 'admin', accountStatus: 'active' }).select('_id');
    await createBulkNotifications(
      admins.map((a) => a._id),
      {
        title: 'New alumni awaiting approval',
        message: `${user.name} registered as an alumnus and is waiting for approval.`,
        type: 'info',
        category: 'account',
        link: '/admin/alumni-approvals',
      }
    );
    await createNotification({
      user: user._id,
      title: 'Registration received',
      message:
        'Your alumni account is pending administrator approval. You can complete your profile while you wait.',
      type: 'info',
      category: 'account',
      link: '/alumni/profile',
    });
  }

  const token = signAuthToken(user);
  setAuthCookie(res, token);

  return sendSuccess(res, await buildMePayload(user), {
    status: 201,
    message: isAlumni
      ? 'Registration successful. Your alumni account is pending administrator approval.'
      : 'Registration successful. Welcome to AlumniConnect!',
  });
});

/** POST /api/v1/auth/login */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (user.accountStatus === 'suspended') {
    throw ApiError.forbidden('Your account has been suspended. Please contact the administrator.');
  }
  if (user.accountStatus === 'inactive') {
    throw ApiError.forbidden('Your account is inactive. Please contact the administrator.');
  }
  if (user.role === 'alumni' && user.approvalStatus === 'rejected') {
    throw ApiError.forbidden('Your alumni registration was rejected. Please contact the administrator.');
  }

  user.lastLogin = new Date();
  await user.save();

  await logActivity({
    actor: user,
    action: 'user.login',
    entity: 'User',
    entityId: user._id,
    description: `${user.name} signed in.`,
  });

  const token = signAuthToken(user);
  setAuthCookie(res, token);

  return sendSuccess(res, await buildMePayload(user), { message: 'Signed in successfully.' });
});

/** POST /api/v1/auth/logout */
const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  return sendSuccess(res, null, { message: 'Signed out successfully.' });
});

/** GET /api/v1/auth/me */
const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, await buildMePayload(req.user), { message: 'Current session.' });
});

/**
 * POST /api/v1/auth/forgot-password
 * Local-development placeholder. No email is sent. A reset token is generated,
 * stored on the user document and printed to the server console.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  const genericMessage =
    'If an account exists for that email address, a password reset link has been generated. Check with your administrator in this local demo environment.';

  if (!user) {
    return sendSuccess(res, null, { message: genericMessage });
  }

  const rawToken = randomToken(24);
  user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save({ validateBeforeSave: false });

  if (!env.isProduction) {
    // eslint-disable-next-line no-console
    console.log(
      `\n[forgot-password] Reset token for ${user.email}:\n  ${rawToken}\n` +
        `  Reset with: POST /api/v1/auth/reset-password { "token": "<token>", "password": "<new password>" }\n`
    );
  }

  return sendSuccess(res, env.isProduction ? null : { devResetToken: rawToken }, {
    message: genericMessage,
  });
});

/**
 * POST /api/v1/auth/reset-password
 * Completes the local reset flow using the token issued above.
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    throw ApiError.badRequest('A reset token and a new password are required.');
  }
  if (password.length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters long.');
  }

  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw ApiError.badRequest('This reset link is invalid or has expired.');
  }

  await user.setPassword(password);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  await logActivity({
    actor: user,
    action: 'user.password_reset',
    entity: 'User',
    entityId: user._id,
    description: `${user.name} reset their password.`,
  });

  return sendSuccess(res, null, { message: 'Your password has been updated. You can now sign in.' });
});

module.exports = {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  buildMePayload,
  setAuthCookie,
  clearAuthCookie,
};
