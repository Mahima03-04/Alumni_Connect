'use strict';

const mongoose = require('mongoose');

const workExperienceSchema = new mongoose.Schema(
  {
    company: { type: String, trim: true, required: true, maxlength: 160 },
    title: { type: String, trim: true, required: true, maxlength: 160 },
    from: { type: Date, default: null },
    to: { type: Date, default: null },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { _id: true }
);

const alumniProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    university: { type: String, trim: true, default: '', maxlength: 200, index: true },
    department: { type: String, trim: true, default: '', maxlength: 200, index: true },
    degree: { type: String, trim: true, default: '', maxlength: 160 },
    course: { type: String, trim: true, default: '', maxlength: 160 },
    graduationYear: { type: Number, default: null, min: 1950, max: 2100, index: true },
    batch: { type: String, trim: true, default: '', maxlength: 40, index: true },
    currentCompany: { type: String, trim: true, default: '', maxlength: 200, index: true },
    jobTitle: { type: String, trim: true, default: '', maxlength: 200, index: true },
    workExperience: { type: [workExperienceSchema], default: [] },
    skills: { type: [String], default: [], index: true },
    biography: { type: String, trim: true, default: '', maxlength: 2000 },
    linkedinUrl: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '', maxlength: 160 },
    // Whether this alumnus is willing to mentor students.
    openToMentorship: { type: Boolean, default: true },
    mentorshipAreas: { type: [String], default: [] },
    profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

alumniProfileSchema.index({ department: 1, graduationYear: 1 });
alumniProfileSchema.index({ currentCompany: 1, jobTitle: 1 });
alumniProfileSchema.index({
  university: 'text',
  department: 'text',
  currentCompany: 'text',
  jobTitle: 'text',
  skills: 'text',
  biography: 'text',
});

module.exports = mongoose.model('AlumniProfile', alumniProfileSchema);
