'use strict';

const ActivityLog = require('../models/ActivityLog');

/**
 * Record an entry in the platform activity log. Best effort: logging must never
 * break the user's request.
 */
async function logActivity({ actor, action, entity = '', entityId = null, description = '', meta = {} }) {
  try {
    return await ActivityLog.create({
      actor: actor?._id || null,
      actorName: actor?.name || 'System',
      actorRole: actor?.role || 'system',
      action,
      entity,
      entityId,
      description,
      meta,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[activity] failed to log activity:', error.message);
    return null;
  }
}

module.exports = { logActivity };
