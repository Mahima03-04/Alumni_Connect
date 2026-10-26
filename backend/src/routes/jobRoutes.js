'use strict';

const express = require('express');
const jobController = require('../controllers/jobController');
const { protect, authorize, requireApprovedAlumni } = require('../middleware/auth');
const { createJobRules, updateJobRules, applyRules, updateApplicationStatusRules } = require('../validators/jobValidators');
const validate = require('../middleware/validate');
const { uploadResume } = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.get('/', authorize('student', 'alumni', 'admin'), jobController.listJobs);
router.post('/', requireApprovedAlumni, createJobRules, validate, jobController.createJob);

router.post(
  '/:id/apply',
  authorize('student'),
  uploadResume.single('resume'),
  applyRules,
  validate,
  jobController.applyToJob
);
router.get('/:id/applications', authorize('alumni', 'admin'), jobController.getJobApplications);

router.get('/:id', authorize('student', 'alumni', 'admin'), jobController.getJob);
router.put('/:id', authorize('alumni', 'admin'), updateJobRules, validate, jobController.updateJob);
router.delete('/:id', authorize('alumni', 'admin'), jobController.deleteJob);

module.exports = router;
