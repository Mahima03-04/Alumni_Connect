'use strict';

const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    registrationStatus: {
      type: String,
      enum: ['registered', 'cancelled', 'attended'],
      default: 'registered',
      index: true,
    },
    attendeeName: { type: String, trim: true, default: '' },
    attendeeEmail: { type: String, trim: true, lowercase: true, default: '' },
    attendeeRole: { type: String, enum: ['student', 'alumni', 'admin', null], default: null },
    registeredAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// A user can hold at most one registration document per event. Cancelling
// flips the status instead of creating a duplicate row.
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });
eventRegistrationSchema.index({ event: 1, registrationStatus: 1 });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
