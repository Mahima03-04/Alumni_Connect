'use strict';

const { body } = require('express-validator');

const createEventRules = [
  body('title').trim().notEmpty().withMessage('Event title is required.').isLength({ max: 200 }),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Event description is required.')
    .isLength({ min: 20, max: 8000 })
    .withMessage('Description must be between 20 and 8000 characters.'),
  body('eventType')
    .optional()
    .isIn(['workshop', 'seminar', 'webinar', 'reunion', 'career_fair', 'guest_lecture', 'other']),
  body('mode').optional().isIn(['online', 'offline', 'hybrid']),
  body('venue').optional({ values: 'falsy' }).trim().isLength({ max: 300 }),
  body('startDate').isISO8601().withMessage('A valid start date is required.').toDate(),
  body('endDate').isISO8601().withMessage('A valid end date is required.').toDate(),
  body('endDate').custom((value, { req }) => {
    if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
      throw new Error('End date must be on or after the start date.');
    }
    return true;
  }),
  body('registrationDeadline').optional({ values: 'null' }).isISO8601().toDate(),
  body('capacity').optional().isInt({ min: 1, max: 100000 }).toInt(),
  body('audience').optional().isIn(['all', 'students', 'alumni']),
  body('status').optional().isIn(['draft', 'published', 'cancelled', 'completed']),
  body('bannerColor').optional({ values: 'falsy' }).trim().isLength({ max: 24 }),
];

const updateEventRules = createEventRules;

const announcementRules = [
  body('title').trim().notEmpty().withMessage('Title is required.').isLength({ max: 200 }),
  body('body')
    .trim()
    .notEmpty()
    .withMessage('Body is required.')
    .isLength({ min: 10, max: 8000 })
    .withMessage('Body must be between 10 and 8000 characters.'),
  body('audience').optional().isIn(['all', 'students', 'alumni', 'admins']),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  body('status').optional().isIn(['draft', 'published', 'archived']),
  body('expiresAt').optional({ values: 'null' }).isISO8601().toDate(),
];

module.exports = { createEventRules, updateEventRules, announcementRules };
