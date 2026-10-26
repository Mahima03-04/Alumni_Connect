'use strict';

const Notification = require('../models/Notification');

/**
 * Create a single notification for a user.
 * Never throws into the caller's request flow - notifications are best effort.
 */
async function createNotification({
  user,
  title,
  message,
  type = 'info',
  category = 'system',
  link = '',
}) {
  if (!user) return null;
  try {
    return await Notification.create({ user, title, message, type, category, link });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[notification] failed to create notification:', error.message);
    return null;
  }
}

/** Create the same notification for many users at once. */
async function createBulkNotifications(userIds = [], payload = {}) {
  if (!userIds.length) return [];
  const docs = userIds.map((user) => ({
    user,
    title: payload.title,
    message: payload.message,
    type: payload.type || 'info',
    category: payload.category || 'system',
    link: payload.link || '',
  }));
  try {
    return await Notification.insertMany(docs, { ordered: false });
  } catch (error) {
    console.error('[notification] bulk insert failed:', error.message);
    return [];
  }
}

module.exports = { createNotification, createBulkNotifications };
