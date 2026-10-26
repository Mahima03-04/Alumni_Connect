'use strict';

const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/student', authorize('student'), dashboardController.getStudentDashboard);
router.get('/alumni', authorize('alumni'), dashboardController.getAlumniDashboard);

module.exports = router;
