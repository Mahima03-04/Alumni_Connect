'use strict';

const mongoose = require('mongoose');

const mentorshipRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    alumni: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: [true, 'A message is required'],
      trim: true,
      maxlength: 2000,
    },
    careerGoal: {
      type: String,
      required: [true, 'A career goal is required'],
      trim: true,
      maxlength: 1000,
    },
    areaOfInterest: { type: String, trim: true, default: '', maxlength: 160 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    responseMessage: { type: String, trim: true, default: '', maxlength: 2000 },
    meetingDetails: {
      mode: { type: String, enum: ['online', 'offline', null], default: null },
      scheduledAt: { type: Date, default: null },
      location: { type: String, trim: true, default: '', maxlength: 300 },
      link: { type: String, trim: true, default: '', maxlength: 500 },
      notes: { type: String, trim: true, default: '', maxlength: 1000 },
    },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// A student can only have one active (pending or accepted) request per alumnus.
mentorshipRequestSchema.index(
  { student: 1, alumni: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'accepted'] } },
    name: 'unique_active_mentorship_request',
  }
);
mentorshipRequestSchema.index({ alumni: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
