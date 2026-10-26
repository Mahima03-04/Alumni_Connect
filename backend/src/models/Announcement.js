'use strict';

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: [true, 'Announcement body is required'],
      trim: true,
      maxlength: 8000,
    },
    audience: {
      type: String,
      enum: ['all', 'students', 'alumni', 'admins'],
      default: 'all',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    publishedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

announcementSchema.index({ status: 1, publishedAt: -1 });
announcementSchema.index({ title: 'text', body: 'text' });

module.exports = mongoose.model('Announcement', announcementSchema);
