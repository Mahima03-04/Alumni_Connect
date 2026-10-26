'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const env = require('./config/env');
const routes = require('./routes');
const { issueCsrfToken, csrfProtection } = require('./middleware/csrf');
const { globalLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { UPLOAD_ROOT } = require('./middleware/upload');

const app = express();

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
app.use(
  helmet({
    // Allow the API to serve uploaded images that the SPA may load cross-origin.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

// ---------------------------------------------------------------------------
// CORS - credentials are required because auth uses an httpOnly cookie.
// ---------------------------------------------------------------------------
const allowedOrigins = [env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / tools (curl, supertest) that send no Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  })
);

// ---------------------------------------------------------------------------
// Body / cookie parsing and sanitisation
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
// Strip Mongo operators ($, .) from user input to block query injection.
app.use(mongoSanitize());

if (!env.isTest) {
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
}

// ---------------------------------------------------------------------------
// Static uploads (profile photos and resumes)
// ---------------------------------------------------------------------------
app.use(
  '/uploads',
  express.static(UPLOAD_ROOT, {
    maxAge: '1d',
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'AlumniConnect API is healthy.', data: { uptime: process.uptime() } });
});

// ---------------------------------------------------------------------------
// Rate limiting + CSRF
// ---------------------------------------------------------------------------
app.use('/api', globalLimiter);
app.use(issueCsrfToken);
app.use(csrfProtection);

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api/v1', routes);

// ---------------------------------------------------------------------------
// 404 + centralised error handling
// ---------------------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
