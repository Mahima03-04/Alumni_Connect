'use strict';

const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { updateUserStatusRules, alumniApprovalRules, jobApprovalRules } = require('../validators/adminValidators');
const validate = require('../middleware/validate');

const router = express.Router();

// Every admin route requires an authenticated administrator.
router.use(protect, authorize('admin'));

router.get('/dashboard', adminController.getDashboard);

router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/status', updateUserStatusRules, validate, adminController.updateUserStatus);

router.get('/alumni/pending', adminController.getPendingAlumni);
router.get('/alumni/reviewed', adminController.getReviewedAlumni);
router.patch('/alumni/:id/approval', alumniApprovalRules, validate, adminController.updateAlumniApproval);

router.get('/jobs/pending', adminController.getPendingJobs);
router.get('/jobs', adminController.listAllJobs);
router.patch('/jobs/:id/approval', jobApprovalRules, validate, adminController.updateJobApproval);

router.get('/mentorship', adminController.getMentorshipMonitoring);

router.get('/reports', adminController.getReports);
router.get('/reports/export', adminController.exportReport);

router.get('/activity', adminController.getActivity);

module.exports = router;
