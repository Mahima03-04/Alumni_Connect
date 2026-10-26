'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [120, 'Name must be at most 120 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'alumni', 'admin'],
        message: 'Role must be student, alumni or admin',
      },
      default: 'student',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    // Only meaningful for alumni accounts (admins/students use not_required).
    approvalStatus: {
      type: String,
      enum: ['not_required', 'pending', 'approved', 'rejected'],
      default: 'not_required',
      index: true,
    },
    approvalReason: { type: String, trim: true, default: null, maxlength: 500 },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    profilePhoto: { type: String, default: null },
    phone: { type: String, trim: true, default: null, maxlength: 30 },
    lastLogin: { type: Date, default: null },
    // Used by the local-development forgot-password placeholder only.
    passwordResetToken: { type: String, select: false, default: null },
    passwordResetExpires: { type: Date, select: false, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        // Expose a friendly string id in addition to _id.
        if (ret._id) ret.id = String(ret._id);
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1, accountStatus: 1 });
userSchema.index({ approvalStatus: 1, role: 1 });
userSchema.index({ name: 'text', email: 'text' });

/** Hash a plaintext password. Never store the plaintext value. */
userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
};

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, SALT_ROUNDS);
  return this.passwordHash;
};

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

/** Convenience flags used by controllers and the frontend. */
userSchema.virtual('isApprovedAlumni').get(function isApprovedAlumni() {
  return this.role === 'alumni' && this.approvalStatus === 'approved';
});

userSchema.virtual('canLogin').get(function canLogin() {
  if (this.accountStatus !== 'active') return false;
  if (this.role === 'alumni' && this.approvalStatus === 'rejected') return false;
  return true;
});

module.exports = mongoose.model('User', userSchema);
