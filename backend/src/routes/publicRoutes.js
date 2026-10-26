'use strict';

const express = require('express');
const publicController = require('../controllers/publicController');

const router = express.Router();

router.get('/stats', publicController.getPublicStats);
router.get('/alumni-preview', publicController.getAlumniPreview);
router.get('/testimonials', publicController.getTestimonials);

module.exports = router;
