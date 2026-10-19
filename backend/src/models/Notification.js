// Notification.js
// Something one person needs to know about, kept as data (Milestone 8):
// a swap proposed to them, accepted, declined, cancelled, expired, waiting
// for approval, approved, rejected, done or failed.
//
// Small on purpose - the chain it is about and one plain sentence. The Swaps
// page lists them for now; the full notification centre is Milestone 9.

import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = Object.freeze([
  'swap_proposed',
  'swap_accepted',
  'swap_declined',
  'swap_cancelled',
  'swap_expired',
  'swap_awaiting_approval',
  'swap_approved',
  'swap_rejected',
  'swap_committed',
  'swap_failed',
]);

const notificationSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true },
    // Who it is for.
    membershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    chainId: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapChain', default: null },
    message: { type: String, required: true, maxlength: 500 },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One person's newest first.
notificationSchema.index({ membershipId: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification ?? mongoose.model('Notification', notificationSchema);

export default Notification;
