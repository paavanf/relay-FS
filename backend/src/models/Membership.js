// Membership.js
// Joins a User to an Organisation and records what they are within it.
// This is the record every permission check reads.

import mongoose from 'mongoose';
import { ROLE_VALUES, ROLES, MEMBERSHIP_STATUS } from '../config/constants.js';

const membershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
      index: true,
    },

    role: { type: String, enum: ROLE_VALUES, required: true, default: ROLES.MEMBER },

    status: {
      type: String,
      enum: Object.values(MEMBERSHIP_STATUS),
      required: true,
      default: MEMBERSHIP_STATUS.ACTIVE,
    },

    qualificationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Qualification' }],

    employmentType: { type: String, enum: ['full-time', 'part-time', 'casual'], default: 'casual' },
    contractedHoursPerWeek: { type: Number, min: 0, max: 168, default: 0 },

    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// A user can only hold one membership per organisation.
membershipSchema.index({ userId: 1, orgId: 1 }, { unique: true });

export const Membership =
  mongoose.models.Membership ?? mongoose.model('Membership', membershipSchema);

export default Membership;
