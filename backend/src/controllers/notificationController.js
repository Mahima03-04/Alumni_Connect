'use strict';

const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

/** GET /api/v1/notifications */
const listNotifications = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query, { defaultLimit: 20 });
  const filter = { user: req.user._id };
  if (req.query.read === 'true') filter.read = true;
  if (req.query.read === 'false') filter.read = false;
  if (req.query.category) filter.category = req.query.category;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);

  return sendSuccess(res, notifications, {
    message: 'Notifications loaded.',
    meta: { ...pagination.meta(total), unreadCount },
  });
});

/** GET /api/v1/notifications/unread-count */
const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
  return sendSuccess(res, { unreadCount }, { message: 'Unread notification count.' });
});

/** PATCH /api/v1/notifications/:id/read */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw ApiError.notFound('Notification not found.');
  if (String(notification.user) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only update your own notifications.');
  }

  if (!notification.read) {
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return sendSuccess(res, notification, { message: 'Notification marked as read.' });
});

/** PATCH /api/v1/notifications/read-all */
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
  return sendSuccess(res, { updated: result.modifiedCount }, { message: 'All notifications marked as read.' });
});

/** DELETE /api/v1/notifications/:id */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw ApiError.notFound('Notification not found.');
  if (String(notification.user) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only delete your own notifications.');
  }
  await notification.deleteOne();
  return sendSuccess(res, null, { message: 'Notification deleted.' });
});

module.exports = { listNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification };
