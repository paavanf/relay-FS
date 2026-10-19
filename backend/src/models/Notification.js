// Notification.js
// Something one person needs to know about: a roster published with their
// shifts on it, a swap proposed to them or waiting for their approval, how
// a swap they are in ended, someone joining the team they manage. Every one
// is written by services/notification/notify.service.js, so the wording and
// the payload are the same wherever an event comes from.
//
//   message      one plain sentence
//   link         the frontend page it is about, e.g. /app/<org>/swaps?chain=<id>
//   chainId, rosterId, aboutMembershipId   the records it is about
//   dedupeKey    event, subject and recipient: each person hears about each
//                event once, however often the code that reports it runs
//   readAt       when its reader opened it, or marked everything read
//   emailedAt    when it was claimed for email - the claim is what makes
//                "never two emails for the same event" hold

import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

export const NOTIFICATION_TYPES = Object.freeze([
  'roster_published',
  'swap_proposed',
  'swap_accepted',
  'swap_declined',
  'swap_cancelled',
  'swap_expired',
  'swap_awaiting_approval',
  // Written by Milestone 8 alongside swap_committed; kept so its records stay valid.
  'swap_approved',
  'swap_rejected',
  'swap_committed',
  'swap_failed',
  'member_joined',
]);

const notificationSchema = new mongoose.Schema(
  {
    orgId: { type: ObjectId, ref: 'Organisation', required: true },
    // Who it is for.
    membershipId: { type: ObjectId, ref: 'Membership', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    message: { type: String, required: true, maxlength: 500 },
    link: { type: String, default: null },

    chainId: { type: ObjectId, ref: 'SwapChain', default: null },
    rosterId: { type: ObjectId, ref: 'Roster', default: null },
    aboutMembershipId: { type: ObjectId, ref: 'Membership', default: null },

    dedupeKey: { type: String, default: null },
    readAt: { type: Date, default: null },
    emailedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One person's newest first - the bell, the panel and the page - and their unread count.
notificationSchema.index({ membershipId: 1, _id: -1 });
notificationSchema.index({ membershipId: 1, readAt: 1 });
// Each person hears about each event once, enforced by the database.
notificationSchema.index({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });

export const Notification = mongoose.models.Notification ?? mongoose.model('Notification', notificationSchema);

export default Notification;
