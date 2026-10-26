'use strict';

const Announcement = require('../models/Announcement');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const { createBulkNotifications } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');

const EDITABLE_FIELDS = ['title', 'body', 'audience', 'priority', 'status', 'expiresAt'];

function pick(source, allowed) {
  const out = {};
  allowed.forEach((key) => {
    if (source[key] !== undefined) out[key] = source[key];
  });
  return out;
}

/**
 * GET /api/v1/announcements
 * Administrators see every announcement (drafts included). Everyone else only
 * sees published announcements that target their role.
 */
const listAnnouncements = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query, { defaultLimit: 10 });
  const filter = {};

  if (req.user && req.user.role === 'admin') {
    if (req.query.status) filter.status = req.query.status;
    if (req.query.audience) filter.audience = req.query.audience;
  } else {
    filter.status = 'published';
    filter.$or = [{ audience: 'all' }, { audience: req.user ? req.user.role : 'students' }];
    filter.expiresAt = { $in: [null, undefined] };
  }

  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.title = rx;
  }

  const [announcements, total] = await Promise.all([
    Announcement.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
    Announcement.countDocuments(filter),
  ]);

  return sendSuccess(res, announcements, { message: 'Announcements loaded.', meta: pagination.meta(total) });
});

/** GET /api/v1/announcements/:id */
const getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw ApiError.notFound('Announcement not found.');

  const isAdmin = req.user && req.user.role === 'admin';
  if (!isAdmin) {
    if (announcement.status !== 'published') throw ApiError.notFound('Announcement not found.');
    if (!['all', req.user.role].includes(announcement.audience)) {
      throw ApiError.forbidden('This announcement is not addressed to you.');
    }
  }

  return sendSuccess(res, announcement, { message: 'Announcement loaded.' });
});

/** POST /api/v1/announcements (admin) */
const createAnnouncement = asyncHandler(async (req, res) => {
  const payload = pick(req.body, EDITABLE_FIELDS);
  payload.createdBy = req.user._id;
  if (payload.status === 'published') payload.publishedAt = new Date();

  const announcement = await Announcement.create(payload);

  await logActivity({
    actor: req.user,
    action: 'announcement.create',
    entity: 'Announcement',
    entityId: announcement._id,
    description: `${req.user.name} created the announcement "${announcement.title}".`,
  });

  if (announcement.status === 'published') await notifyAudience(announcement);

  return sendSuccess(res, announcement, { status: 201, message: 'Announcement created successfully.' });
});

async function notifyAudience(announcement) {
  const roleFilter = announcement.audience === 'all' ? { $in: ['student', 'alumni'] } : announcement.audience;
  const users = await User.find({ role: roleFilter, accountStatus: 'active' }).select('_id');
  await createBulkNotifications(
    users.map((u) => u._id),
    {
      title: 'New announcement',
      message: announcement.title,
      type: announcement.priority === 'urgent' ? 'warning' : 'info',
      category: 'announcement',
      link: `/announcements/${announcement._id}`,
    }
  );
}

/** PUT /api/v1/announcements/:id (admin) */
const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw ApiError.notFound('Announcement not found.');

  const wasPublished = announcement.status === 'published';
  Object.assign(announcement, pick(req.body, EDITABLE_FIELDS));
  if (!wasPublished && announcement.status === 'published') announcement.publishedAt = new Date();
  await announcement.save();

  await logActivity({
    actor: req.user,
    action: 'announcement.update',
    entity: 'Announcement',
    entityId: announcement._id,
    description: `${req.user.name} updated the announcement "${announcement.title}".`,
  });

  if (!wasPublished && announcement.status === 'published') await notifyAudience(announcement);

  return sendSuccess(res, announcement, { message: 'Announcement updated successfully.' });
});

/** DELETE /api/v1/announcements/:id (admin) */
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw ApiError.notFound('Announcement not found.');

  await announcement.deleteOne();

  await logActivity({
    actor: req.user,
    action: 'announcement.delete',
    entity: 'Announcement',
    entityId: announcement._id,
    description: `${req.user.name} deleted the announcement "${announcement.title}".`,
  });

  return sendSuccess(res, null, { message: 'Announcement deleted successfully.' });
});

module.exports = {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
