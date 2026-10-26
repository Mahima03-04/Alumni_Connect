'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Load backend/.env regardless of the current working directory.
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const bool = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const NODE_ENV = process.env.NODE_ENV || 'development';
const isTest = NODE_ENV === 'test';

const env = {
  NODE_ENV,
  isTest,
  isProduction: NODE_ENV === 'production',
  port: num(process.env.PORT, 5000),

  mongoUri: isTest
    ? process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/alumniconnect_test'
    : process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/alumniconnect',

  jwt: {
    secret: process.env.JWT_SECRET || 'alumniconnect_insecure_development_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieName: process.env.JWT_COOKIE_NAME || 'ac_token',
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookieSecure: bool(process.env.COOKIE_SECURE, false),

  csrfEnabled: bool(process.env.CSRF_ENABLED, true),

  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxUploadMb: num(process.env.MAX_UPLOAD_MB, 5),

  rateLimit: {
    enabled: !isTest,
    windowMs: num(process.env.RATE_LIMIT_WINDOW_MINUTES, 15) * 60 * 1000,
    max: num(process.env.RATE_LIMIT_MAX, 300),
    authMax: num(process.env.AUTH_RATE_LIMIT_MAX, 20),
  },
};

// Refuse to boot in production with the shipped placeholder secret.
if (env.isProduction) {
  const weakSecrets = [
    'alumniconnect_insecure_development_secret',
    'change_this_to_a_long_random_secret_string_for_local_development',
    'secret',
    'changeme',
  ];
  if (!process.env.JWT_SECRET || weakSecrets.includes(process.env.JWT_SECRET)) {
    throw new Error(
      'Refusing to start: set a strong JWT_SECRET environment variable before running in production.'
    );
  }
}

module.exports = env;
