'use strict';

const { body } = require('express-validator');

const createJobRules = [
  body('title').trim().notEmpty().withMessage('Job title is required.').isLength({ max: 200 }),
  body('company').trim().notEmpty().withMessage('Company is required.').isLength({ max: 200 }),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Job description is required.')
    .isLength({ min: 30, max: 8000 })
    .withMessage('Job description must be between 30 and 8000 characters.'),
  body('location').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('workMode').optional().isIn(['remote', 'onsite', 'hybrid']),
  body('employmentType')
    .optional()
    .isIn(['full-time', 'part-time', 'internship', 'contract', 'freelance']),
  body('experienceLevel').optional().isIn(['fresher', 'entry', 'mid', 'senior', 'lead']),
  body('skillsRequired').optional().isArray({ max: 40 }),
  body('skillsRequired.*').optional().trim().isLength({ max: 60 }),
  body('salaryMin').optional({ values: 'null' }).isInt({ min: 0 }).toInt(),
  body('salaryMax').optional({ values: 'null' }).isInt({ min: 0 }).toInt(),
  body('salaryCurrency').optional({ values: 'falsy' }).trim().isLength({ max: 8 }),
  body('salaryPeriod').optional().isIn(['month', 'year']),
  body('openings').optional().isInt({ min: 1, max: 1000 }).toInt(),
  body('applicationDeadline').optional({ values: 'null' }).isISO8601().withMessage('Deadline must be a valid date.'),
  body('contactEmail').optional({ values: 'falsy' }).trim().isEmail().withMessage('Contact email must be valid.'),
];

// `PUT` requires the same required fields as create.
const updateJobRules = createJobRules;

const applyRules = [
  body('coverLetter').optional({ values: 'falsy' }).trim().isLength({ max: 4000 }),
];

const updateApplicationStatusRules = [
  body('applicationStatus')
    .isIn(['submitted', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn'])
    .withMessage('Invalid application status.'),
  body('statusNote').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
];

module.exports = { createJobRules, updateJobRules, applyRules, updateApplicationStatusRules };
