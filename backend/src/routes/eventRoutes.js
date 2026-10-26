'use strict';

const express = require('express');
const eventController = require('../controllers/eventController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { createEventRules, updateEventRules } = require('../validators/eventValidators');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', optionalAuth, eventController.listEvents);
router.get('/registrations/me', protect, eventController.getMyRegistrations);

router.post('/', protect, authorize('admin'), createEventRules, validate, eventController.createEvent);
router.get('/:id/registrations', protect, authorize('admin', 'alumni'), eventController.getEventRegistrations);

router.post('/:id/register', protect, authorize('student', 'alumni'), eventController.registerForEvent);
router.delete('/:id/register', protect, authorize('student', 'alumni'), eventController.cancelRegistration);

router.get('/:id', optionalAuth, eventController.getEvent);
router.put('/:id', protect, authorize('admin'), updateEventRules, validate, eventController.updateEvent);
router.delete('/:id', protect, authorize('admin'), eventController.deleteEvent);

module.exports = router;
