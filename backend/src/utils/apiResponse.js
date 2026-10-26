'use strict';

/**
 * Consistent success envelope used by every endpoint:
 *   { success: true, message, data, meta }
 */
function sendSuccess(res, data = null, { status = 200, message = 'OK', meta } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

/** Consistent error envelope. */
function sendError(res, { status = 500, message = 'Something went wrong', errors, code } = {}) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (code) body.code = code;
  return res.status(status).json(body);
}

module.exports = { sendSuccess, sendError };
