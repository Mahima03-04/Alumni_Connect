'use strict';

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: 200,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      maxlength: 8000,
    },
    eventType: {
      type: String,
      enum: ['workshop', 'seminar', 'webinar', 'reunion', 'career_fair', 'guest_lecture', 'other'],
      default: 'seminar',
      index: true,
    },
    mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'offline' },
    venue: { type: String, trim: true, default: '', maxlength: 300 },
    startDate: { type: Date, required: [true, 'Start date is required'], index: true },
    endDate: { type: Date, required: [true, 'End date is required'] },
    registrationDeadline: { type: Date, default: null },
    capacity: { type: Number, default: 100, min: 1, max: 100000 },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizerName: { type: String, trim: true, default: '', maxlength: 200 },
    audience: {
      type: String,
      enum: ['all', 'students', 'alumni'],
      default: 'all',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'draft',
      index: true,
    },
    bannerColor: { type: String, default: 'navy', maxlength: 24 },
  },
  { timestamps: true }
);

eventSchema.index({ status: 1, startDate: 1 });

eventSchema.virtual('isRegistrationOpen').get(function isRegistrationOpen() {
  if (this.status !== 'published') return false;
  if (this.registrationDeadline && new Date(this.registrationDeadline) < new Date()) return false;
  if (new Date(this.endDate) < new Date()) return false;
  return true;
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
