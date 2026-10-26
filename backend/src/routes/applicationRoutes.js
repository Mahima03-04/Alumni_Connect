'use strict';

const express = require('express');
const jobController = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');
const { updateApplicationStatusRules } = require('../validators/jobValidators');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/me', authorize('student'), jobController.getMyApplications);
router.get('/received', authorize('alumni'), jobController.getReceivedApplications);
router.patch('/:id/status', authorize('alumni', 'admin'), updateApplicationStatusRules, validate, jobController.updateApplicationStatus);
router.patch('/:id/withdraw', authorize('student'), jobController.withdrawApplication);

module.exports = router;
