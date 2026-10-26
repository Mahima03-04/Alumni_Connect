'use strict';

const mongoose = require('mongoose');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const { createNotification, createBulkNotifications } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const EDITABLE_FIELDS = [
  'title',
  'description',
  'eventType',
  'mode',
  'venue',
  'startDate',
  'endDate',
  'registrationDeadline',
  'capacity',
  'audience',
  'status',
  'bannerColor',
];

function pick(source, allowed) {
  const out = {};
  allowed.forEach((key) => {
    if (source[key] !== undefined) out[key] = source[key];
  });
  return out;
}

/** How many seats are currently taken. */
async function countRegistered(eventId) {
  return EventRegistration.countDocuments({ event: eventId, registrationStatus: { $ne: 'cancelled' } });
}

/** GET /api/v1/events */
const listEvents = asyncHandler(async (req, res) => {
  const { q, eventType, mode, audience, status, upcoming } = req.query;
  const pagination = getPagination(req.query, { defaultLimit: 9 });

  const filter = {};

  const isAdmin = req.user && req.user.role === 'admin';
  if (isAdmin && req.query.includeAll === 'true') {
    if (status) filter.status = status;
  } else {
    filter.status = 'published';
  }

  if (eventType) filter.eventType = eventType;
  if (mode) filter.mode = mode;
  if (audience) filter.audience = audience;
  if (upcoming === 'true') filter.startDate = { $gte: new Date() };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { venue: rx }];
  }

  const sortBy = req.query.sortBy === 'createdAt' ? 'createdAt' : 'startDate';
  const sortOrder = String(req.query.order || 'asc').toLowerCase() === 'desc' ? -1 : 1;

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ [sortBy]: sortOrder }).skip(pagination.skip).limit(pagination.limit),
    Event.countDocuments(filter),
  ]);

  const ids = events.map((e) => e._id);
  const counts = ids.length
    ? await EventRegistration.aggregate([
        { $match: { event: { $in: ids }, registrationStatus: { $ne: 'cancelled' } } },
        { $group: { _id: '$event', count: { $sum: 1 } } },
      ])
    : [];
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  let myRegistrations = [];
  if (req.user && ids.length) {
    myRegistrations = await EventRegistration.find({
      user: req.user._id,
      event: { $in: ids },
      registrationStatus: { $ne: 'cancelled' },
    }).select('event');
  }
  const mySet = new Set(myRegistrations.map((r) => String(r.event)));

  const data = events.map((e) => ({
    ...e.toObject(),
    registeredCount: countMap.get(String(e._id)) || 0,
    seatsLeft: Math.max(0, e.capacity - (countMap.get(String(e._id)) || 0)),
    isRegistered: mySet.has(String(e._id)),
  }));

  return sendSuccess(res, data, { message: 'Events loaded.', meta: pagination.meta(total) });
});

/** GET /api/v1/events/:id */
const getEvent = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid event identifier.');

  const event = await Event.findById(req.params.id).populate('organizer', 'name email');
  if (!event) throw ApiError.notFound('Event not found.');

  const isAdmin = req.user && req.user.role === 'admin';
  if (event.status !== 'published' && !isAdmin) {
    throw ApiError.notFound('Event not found.');
  }

  const registeredCount = await countRegistered(event._id);
  let registration = null;
  if (req.user) {
    registration = await EventRegistration.findOne({ user: req.user._id, event: event._id });
  }

  return sendSuccess(
    res,
    {
      ...event.toObject(),
      registeredCount,
      seatsLeft: Math.max(0, event.capacity - registeredCount),
      isRegistered: registration ? registration.registrationStatus !== 'cancelled' : false,
      myRegistration: registration,
    },
    { message: 'Event loaded.' }
  );
});

/** POST /api/v1/events (admin) */
const createEvent = asyncHandler(async (req, res) => {
  const payload = pick(req.body, EDITABLE_FIELDS);
  payload.organizer = req.user._id;
  payload.organizerName = req.user.name;

  const event = await Event.create(payload);

  await logActivity({
    actor: req.user,
    action: 'event.create',
    entity: 'Event',
    entityId: event._id,
    description: `${req.user.name} created the event "${event.title}".`,
  });

  if (event.status === 'published') {
    await notifyAudience(event, 'New event published');
  }

  return sendSuccess(res, event.toObject(), { status: 201, message: 'Event created successfully.' });
});

/** Notify the event's target audience about a published event. */
async function notifyAudience(event, title) {
  const roleFilter = event.audience === 'all' ? { $in: ['student', 'alumni'] } : event.audience;
  const users = await User.find({
    role: event.audience === 'alumni' ? 'alumni' : roleFilter,
    accountStatus: 'active',
  }).select('_id');

  await createBulkNotifications(
    users.map((u) => u._id),
    {
      title,
      message: `${event.title} - ${new Date(event.startDate).toLocaleDateString()}`,
      type: 'info',
      category: 'event',
      link: `/events/${event._id}`,
    }
  );
}

/** PUT /api/v1/events/:id (admin) */
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found.');

  const wasPublished = event.status === 'published';
  Object.assign(event, pick(req.body, EDITABLE_FIELDS));
  await event.save();

  await logActivity({
    actor: req.user,
    action: 'event.update',
    entity: 'Event',
    entityId: event._id,
    description: `${req.user.name} updated the event "${event.title}".`,
  });

  if (!wasPublished && event.status === 'published') {
    await notifyAudience(event, 'New event published');
  }

  return sendSuccess(res, event.toObject(), { message: 'Event updated successfully.' });
});

/** DELETE /api/v1/events/:id (admin) */
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found.');

  await EventRegistration.deleteMany({ event: event._id });
  await event.deleteOne();

  await logActivity({
    actor: req.user,
    action: 'event.delete',
    entity: 'Event',
    entityId: event._id,
    description: `${req.user.name} deleted the event "${event.title}".`,
  });

  return sendSuccess(res, null, { message: 'Event deleted successfully.' });
});

/** POST /api/v1/events/:id/register */
const registerForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found.');
  if (event.status !== 'published') throw ApiError.badRequest('This event is not open for registration.');
  if (new Date(event.endDate) < new Date()) throw ApiError.badRequest('This event has already ended.');
  if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
    throw ApiError.badRequest('The registration deadline for this event has passed.');
  }
  if (req.user.role === 'admin') throw ApiError.badRequest('Administrators do not need to register for events.');
  if (event.audience === 'students' && req.user.role !== 'student') {
    throw ApiError.forbidden('This event is open to students only.');
  }
  if (event.audience === 'alumni' && req.user.role !== 'alumni') {
    throw ApiError.forbidden('This event is open to alumni only.');
  }

  const registeredCount = await countRegistered(event._id);
  const existing = await EventRegistration.findOne({ event: event._id, user: req.user._id });

  if (existing && existing.registrationStatus !== 'cancelled') {
    throw ApiError.conflict('You are already registered for this event.');
  }
  if (registeredCount >= event.capacity) {
    throw ApiError.conflict('This event is fully booked.');
  }

  let registration;
  if (existing) {
    existing.registrationStatus = 'registered';
    existing.registeredAt = new Date();
    existing.cancelledAt = null;
    registration = await existing.save();
  } else {
    try {
      registration = await EventRegistration.create({
        event: event._id,
        user: req.user._id,
        attendeeName: req.user.name,
        attendeeEmail: req.user.email,
        attendeeRole: req.user.role,
      });
    } catch (error) {
      if (error.code === 11000) throw ApiError.conflict('You are already registered for this event.');
      throw error;
    }
  }

  await logActivity({
    actor: req.user,
    action: 'event.register',
    entity: 'EventRegistration',
    entityId: registration._id,
    description: `${req.user.name} registered for "${event.title}".`,
  });

  await createNotification({
    user: req.user._id,
    title: 'Event registration confirmed',
    message: `You are registered for "${event.title}".`,
    type: 'success',
    category: 'event',
    link: `/events/${event._id}`,
  });

  return sendSuccess(res, registration.toObject(), { status: 201, message: 'Registered successfully.' });
});

/** DELETE /api/v1/events/:id/register */
const cancelRegistration = asyncHandler(async (req, res) => {
  const registration = await EventRegistration.findOne({ event: req.params.id, user: req.user._id });
  if (!registration || registration.registrationStatus === 'cancelled') {
    throw ApiError.notFound('You do not have an active registration for this event.');
  }

  registration.registrationStatus = 'cancelled';
  registration.cancelledAt = new Date();
  await registration.save();

  const event = await Event.findById(req.params.id);

  await createNotification({
    user: req.user._id,
    title: 'Event registration cancelled',
    message: `Your registration for "${event ? event.title : 'the event'}" has been cancelled.`,
    type: 'warning',
    category: 'event',
    link: '/student/events',
  });

  return sendSuccess(res, registration.toObject(), { message: 'Registration cancelled.' });
});

/** GET /api/v1/events/:id/registrations (admin or organizer) */
const getEventRegistrations = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found.');

  const isOrganizer = String(event.organizer) === String(req.user._id);
  if (!isOrganizer && req.user.role !== 'admin') {
    throw ApiError.forbidden('You cannot view registrations for this event.');
  }

  const pagination = getPagination(req.query, { defaultLimit: 50 });
  const filter = { event: event._id };
  if (req.query.registrationStatus) filter.registrationStatus = req.query.registrationStatus;

  const [registrations, total, activeCount] = await Promise.all([
    EventRegistration.find(filter)
      .sort({ registeredAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('user', 'name email role profilePhoto'),
    EventRegistration.countDocuments(filter),
    countRegistered(event._id),
  ]);

  return sendSuccess(
    res,
    {
      event: {
        id: event._id,
        title: event.title,
        capacity: event.capacity,
        registeredCount: activeCount,
        seatsLeft: Math.max(0, event.capacity - activeCount),
      },
      registrations,
    },
    { message: 'Event registrations loaded.', meta: pagination.meta(total) }
  );
});

/** GET /api/v1/events/registrations/me */
const getMyRegistrations = asyncHandler(async (req, res) => {
  const registrations = await EventRegistration.find({ user: req.user._id })
    .sort({ registeredAt: -1 })
    .populate('event', 'title startDate endDate venue mode eventType status');
  return sendSuccess(res, registrations, { message: 'Your event registrations loaded.' });
});

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getEventRegistrations,
  getMyRegistrations,
};
