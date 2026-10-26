'use strict';

const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    studentId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
      maxlength: 40,
    },
    university: { type: String, trim: true, default: '', maxlength: 200, index: true },
    department: { type: String, trim: true, default: '', maxlength: 200, index: true },
    degree: { type: String, trim: true, default: '', maxlength: 160 },
    course: { type: String, trim: true, default: '', maxlength: 160 },
    currentSemester: { type: Number, default: null, min: 1, max: 16 },
    graduationYear: { type: Number, default: null, min: 1950, max: 2100, index: true },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    // Relative path of the most recently uploaded resume.
    resume: { type: String, default: null },
    biography: { type: String, trim: true, default: '', maxlength: 2000 },
    location: { type: String, trim: true, default: '', maxlength: 160 },
  },
  { timestamps: true }
);

studentProfileSchema.index({ department: 1, graduationYear: 1 });
studentProfileSchema.index({ skills: 1 });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
