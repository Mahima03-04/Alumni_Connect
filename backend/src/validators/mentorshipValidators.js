'use strict';

const { body } = require('express-validator');

const createMentorshipRules = [
  body('alumniId').isMongoId().withMessage('A valid alumni must be selected.'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('A message is required.')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Your message must be between 10 and 2000 characters.'),
  body('careerGoal')
    .trim()
    .notEmpty()
    .withMessage('A career goal is required.')
    .isLength({ min: 3, max: 1000 }),
  body('areaOfInterest').optional({ values: 'falsy' }).trim().isLength({ max: 160 }),
];

const respondMentorshipRules = [
  body('status')
    .isIn(['accepted', 'rejected', 'completed', 'cancelled'])
    .withMessage('Status must be accepted, rejected, completed or cancelled.'),
  body('responseMessage').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }),
  body('meetingDetails.mode').optional({ values: 'null' }).isIn(['online', 'offline']),
  body('meetingDetails.scheduledAt').optional({ values: 'null' }).isISO8601(),
  body('meetingDetails.location').optional({ values: 'falsy' }).trim().isLength({ max: 300 }),
  body('meetingDetails.link').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('meetingDetails.notes').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
];

module.exports = { createMentorshipRules, respondMentorshipRules };
