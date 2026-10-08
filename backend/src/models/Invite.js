// Invite.js
// A pending invitation to join an organisation. Like refresh tokens, only the
// hash of the invite token is stored - the raw value goes to the invitee.

import mongoose from 'mongoose';
import { ROLES } from '../config/constants.js';

const inviteSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
      index: true,
    },

    // Who the invite is for. The accepting user's email must match this.
    email: { type: String, required: true, lowercase: true, trim: true, index: true },

    // Owners are never created by invite. Ownership is only ever handed on by
    // an existing owner, from the Team page.
    role: { type: String, enum: [ROLES.MANAGER, ROLES.MEMBER], required: true },

    qualificationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Qualification' }],

    tokenHash: { type: String, required: true, unique: true, index: true },

    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
    // Set when a manager withdraws it. A revoked invite is as dead as an
    // expired one, but the record stays so there is a trail.
    revokedAt: { type: Date, default: null },

    // The Membership of whoever sent the invite.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', required: true },
  },
  { timestamps: true },
);

export const Invite = mongoose.models.Invite ?? mongoose.model('Invite', inviteSchema);

export default Invite;
