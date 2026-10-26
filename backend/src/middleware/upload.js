'use strict';

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', env.uploadDir);

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function buildStorage(subfolder) {
  return multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, ensureDir(path.join(UPLOAD_ROOT, subfolder)));
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
      const safeBase = path
        .basename(file.originalname, path.extname(file.originalname))
        .replace(/[^a-z0-9-_]/gi, '-')
        .slice(0, 40);
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${safeBase || 'file'}-${unique}${ext}`);
    },
  });
}

function fileFilter(allowed) {
  return (_req, file, cb) => {
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}.`));
  };
}

const maxBytes = env.maxUploadMb * 1024 * 1024;

const uploadPhoto = multer({
  storage: buildStorage('photos'),
  limits: { fileSize: maxBytes, files: 1 },
  fileFilter: fileFilter(IMAGE_TYPES),
});

const uploadResume = multer({
  storage: buildStorage('resumes'),
  limits: { fileSize: maxBytes, files: 1 },
  fileFilter: fileFilter(DOCUMENT_TYPES),
});

module.exports = { uploadPhoto, uploadResume, UPLOAD_ROOT, IMAGE_TYPES, DOCUMENT_TYPES };
