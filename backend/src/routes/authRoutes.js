'use strict';

const express = require('express');
const authController = require('../controllers/authController');
const { registerRules, loginRules, forgotPasswordRules } = require('../validators/authValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { getCsrfToken } = require('../middleware/csrf');

const router = express.Router();

router.get('/csrf', getCsrfToken);

router.post('/register', authLimiter, registerRules, validate, authController.register);
router.post('/login', authLimiter, loginRules, validate, authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.me);
router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

module.exports = router;
