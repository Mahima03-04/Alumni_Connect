'use strict';

const express = require('express');
const profileController = require('../controllers/profileController');
const { protect, authorize } = require('../middleware/auth');
const { uploadPhoto, uploadResume } = require('../middleware/upload');
const { alumniProfileRules, studentProfileRules, basicProfileRules } = require('../validators/profileValidators');
const validate = require('../middleware/validate');

const router = express.Router();

// Every profile route requires a signed-in user.
router.use(protect);

router.get('/metadata', authorize('student', 'alumni', 'admin'), profileController.getDirectoryMetadata);
router.get('/', authorize('student', 'alumni', 'admin'), profileController.listProfiles);

router.put(
  '/me',
  authorize('student', 'alumni'),
  [...basicProfileRules, ...alumniProfileRules, ...studentProfileRules],
  validate,
  profileController.updateMyProfile
);
router.post('/me/photo', authorize('student', 'alumni'), uploadPhoto.single('photo'), profileController.uploadProfilePhoto);
router.delete('/me/photo', authorize('student', 'alumni'), profileController.deleteProfilePhoto);
router.post('/me/resume', authorize('student'), uploadResume.single('resume'), profileController.uploadResume);

// Keep the parameterised route last so /me and /metadata are not swallowed.
router.get('/:id', authorize('student', 'alumni', 'admin'), profileController.getProfileById);

module.exports = router;
