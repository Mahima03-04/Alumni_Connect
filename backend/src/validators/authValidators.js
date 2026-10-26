'use strict';

const { body } = require('express-validator');

const passwordRule = (field = 'password') =>
  body(field)
    .isString()
    .withMessage('Password must be text.')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters.')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter.')
    .matches(/\d/)
    .withMessage('Password must contain at least one number.');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 120 }),
  body('email').trim().toLowerCase().isEmail().withMessage('A valid email is required.').normalizeEmail(),
  passwordRule('password'),
  body('role')
    .optional()
    .isIn(['student', 'alumni'])
    .withMessage('You may only register as a student or an alumni.'),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
];

const loginRules = [
  body('email').trim().toLowerCase().isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required.'),
];

const forgotPasswordRules = [
  body('email').trim().toLowerCase().isEmail().withMessage('A valid email is required.').normalizeEmail(),
];

module.exports = { registerRules, loginRules, forgotPasswordRules, passwordRule };
