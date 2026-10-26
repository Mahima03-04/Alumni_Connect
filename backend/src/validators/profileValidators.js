'use strict';

const { body } = require('express-validator');

const alumniProfileRules = [
  body('university').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('department').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('degree').optional({ values: 'falsy' }).trim().isLength({ max: 160 }),
  body('course').optional({ values: 'falsy' }).trim().isLength({ max: 160 }),
  body('graduationYear')
    .optional({ values: 'null' })
    .isInt({ min: 1950, max: 2100 })
    .withMessage('Graduation year must be between 1950 and 2100.')
    .toInt(),
  body('batch').optional({ values: 'falsy' }).trim().isLength({ max: 40 }),
  body('currentCompany').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('jobTitle').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('biography').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }),
  body('linkedinUrl')
    .optional({ values: 'falsy' })
    .trim()
    .isURL({ require_protocol: false, protocols: ['http', 'https'], require_tld: false })
    .withMessage('LinkedIn URL must be a valid web address.')
    .isLength({ max: 300 }),
  body('skills').optional().isArray({ max: 60 }).withMessage('Skills must be a list.'),
  body('skills.*').optional().trim().isLength({ max: 60 }),
  body('mentorshipAreas').optional().isArray({ max: 30 }),
  body('openToMentorship').optional().isBoolean().toBoolean(),
  body('workExperience').optional().isArray({ max: 30 }),
  body('workExperience.*.company').trim().notEmpty().withMessage('Company is required for work experience.'),
  body('workExperience.*.title').trim().notEmpty().withMessage('Job title is required for work experience.'),
];

const studentProfileRules = [
  body('studentId').optional({ values: 'falsy' }).trim().isLength({ max: 40 }),
  body('university').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('department').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('degree').optional({ values: 'falsy' }).trim().isLength({ max: 160 }),
  body('course').optional({ values: 'falsy' }).trim().isLength({ max: 160 }),
  body('currentSemester')
    .optional({ values: 'null' })
    .isInt({ min: 1, max: 16 })
    .withMessage('Current semester must be between 1 and 16.')
    .toInt(),
  body('graduationYear')
    .optional({ values: 'null' })
    .isInt({ min: 1950, max: 2100 })
    .withMessage('Graduation year must be between 1950 and 2100.')
    .toInt(),
  body('skills').optional().isArray({ max: 60 }),
  body('skills.*').optional().trim().isLength({ max: 60 }),
  body('interests').optional().isArray({ max: 60 }),
  body('biography').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }),
  body('location').optional({ values: 'falsy' }).trim().isLength({ max: 160 }),
];

const basicProfileRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.').isLength({ max: 120 }),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
];

module.exports = { alumniProfileRules, studentProfileRules, basicProfileRules };
