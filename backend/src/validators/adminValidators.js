'use strict';

const { body, param } = require('express-validator');

const updateUserStatusRules = [
  body('accountStatus')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Account status must be active, inactive or suspended.'),
  body('role')
    .optional()
    .isIn(['student', 'alumni'])
    .withMessage('Administrators may only assign the student or alumni role.'),
  body('reason').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
];

const alumniApprovalRules = [
  body('approvalStatus')
    .isIn(['approved', 'rejected'])
    .withMessage('Approval status must be approved or rejected.'),
  body('reason')
    .if(body('approvalStatus').equals('rejected'))
    .trim()
    .notEmpty()
    .withMessage('A rejection reason is required.')
    .isLength({ max: 500 }),
];

const jobApprovalRules = [
  body('approvalStatus')
    .isIn(['approved', 'rejected'])
    .withMessage('Approval status must be approved or rejected.'),
  body('reason')
    .if(body('approvalStatus').equals('rejected'))
    .trim()
    .notEmpty()
    .withMessage('A rejection reason is required.')
    .isLength({ max: 500 }),
];

const idParam = [param('id').isMongoId().withMessage('Invalid identifier supplied.')];

module.exports = { updateUserStatusRules, alumniApprovalRules, jobApprovalRules, idParam };
