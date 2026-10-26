'use strict';

const express = require('express');
const announcementController = require('../controllers/announcementController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { announcementRules } = require('../validators/eventValidators');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', optionalAuth, announcementController.listAnnouncements);

router.post('/', protect, authorize('admin'), announcementRules, validate, announcementController.createAnnouncement);
router.put('/:id', protect, authorize('admin'), announcementRules, validate, announcementController.updateAnnouncement);
router.delete('/:id', protect, authorize('admin'), announcementController.deleteAnnouncement);

router.get('/:id', optionalAuth, announcementController.getAnnouncement);

module.exports = router;
