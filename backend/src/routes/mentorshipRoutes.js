'use strict';

const express = require('express');
const mentorshipController = require('../controllers/mentorshipController');
const { protect, authorize } = require('../middleware/auth');
const { createMentorshipRules, respondMentorshipRules } = require('../validators/mentorshipValidators');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', authorize('student', 'alumni', 'admin'), mentorshipController.listMentors);

router.post('/requests', authorize('student'), createMentorshipRules, validate, mentorshipController.createRequest);
router.get('/requests/me', authorize('student', 'alumni', 'admin'), mentorshipController.getMyRequests);
router.get('/requests/:id', authorize('student', 'alumni', 'admin'), mentorshipController.getRequestById);
router.patch('/requests/:id', authorize('student', 'alumni', 'admin'), respondMentorshipRules, validate, mentorshipController.respondToRequest);
router.delete('/requests/:id', authorize('student', 'admin'), mentorshipController.deleteRequest);

module.exports = router;
