'use strict';

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorName: { type: String, trim: true, default: '' },
    actorRole: { type: String, trim: true, default: '' },
    action: { type: String, required: true, trim: true, maxlength: 120, index: true },
    entity: { type: String, trim: true, default: '', maxlength: 80 },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    description: { type: String, trim: true, default: '', maxlength: 500 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
