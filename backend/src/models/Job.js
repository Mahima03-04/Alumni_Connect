'use strict';

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: 200,
    },
    company: {
      type: String,
      required: [true, 'Company is required'],
      trim: true,
      maxlength: 200,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      maxlength: 8000,
    },
    location: { type: String, trim: true, default: '', maxlength: 200, index: true },
    workMode: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      default: 'onsite',
      index: true,
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'internship', 'contract', 'freelance'],
      default: 'full-time',
      index: true,
    },
    skillsRequired: { type: [String], default: [], index: true },
    experienceLevel: {
      type: String,
      enum: ['fresher', 'entry', 'mid', 'senior', 'lead'],
      default: 'entry',
    },
    salaryMin: { type: Number, default: null, min: 0 },
    salaryMax: { type: Number, default: null, min: 0 },
    salaryCurrency: { type: String, default: 'INR', maxlength: 8 },
    salaryPeriod: {
      type: String,
      enum: ['month', 'year'],
      default: 'year',
    },
    applicationDeadline: { type: Date, default: null },
    openings: { type: Number, default: 1, min: 1, max: 1000 },
    contactEmail: { type: String, trim: true, default: '', lowercase: true },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, trim: true, default: null, maxlength: 500 },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    jobStatus: {
      type: String,
      enum: ['open', 'closed', 'withdrawn'],
      default: 'open',
      index: true,
    },
    views: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

jobSchema.index({ approvalStatus: 1, jobStatus: 1, createdAt: -1 });
jobSchema.index({ title: 'text', company: 'text', description: 'text', skillsRequired: 'text' });

jobSchema.virtual('isAcceptingApplications').get(function isAcceptingApplications() {
  if (this.jobStatus !== 'open' || this.approvalStatus !== 'approved') return false;
  if (this.applicationDeadline && new Date(this.applicationDeadline) < new Date()) return false;
  return true;
});

jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);
