'use strict';

const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Copy of the applicant details at the moment of applying, so a later
    // profile edit does not silently rewrite history.
    applicantName: { type: String, trim: true, default: '' },
    applicantEmail: { type: String, trim: true, lowercase: true, default: '' },
    resume: { type: String, required: [true, 'A resume is required'], maxlength: 500 },
    coverLetter: { type: String, trim: true, maxlength: 4000, default: '' },
    applicationStatus: {
      type: String,
      enum: ['submitted', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
      default: 'submitted',
      index: true,
    },
    statusNote: { type: String, trim: true, maxlength: 1000, default: '' },
    appliedAt: { type: Date, default: Date.now },
    statusUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One student may apply to a given job only once. Enforced by the database.
jobApplicationSchema.index({ job: 1, student: 1 }, { unique: true });
jobApplicationSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
