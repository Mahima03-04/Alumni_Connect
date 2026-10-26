'use strict';

const express = require('express');

const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const jobRoutes = require('./jobRoutes');
const applicationRoutes = require('./applicationRoutes');
const mentorshipRoutes = require('./mentorshipRoutes');
const eventRoutes = require('./eventRoutes');
const announcementRoutes = require('./announcementRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const publicRoutes = require('./publicRoutes');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'AlumniConnect API v1',
    data: {
      name: 'AlumniConnect API',
      version: '1.0.0',
      resources: [
        'auth',
        'profiles',
        'jobs',
        'applications',
        'mentorship',
        'events',
        'announcements',
        'notifications',
        'dashboard',
        'admin',
        'public',
      ],
    },
  });
});

router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/mentorship', mentorshipRoutes);
router.use('/events', eventRoutes);
router.use('/announcements', announcementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);
router.use('/public', publicRoutes);

module.exports = router;
