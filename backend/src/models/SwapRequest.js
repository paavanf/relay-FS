// SwapRequest.js
// A worker offering one of their published shifts to whoever can take it.
//
// Each open request is one offer in the swap chain finder's graph. Looking
// for options never changes it. Its status:
//
//   open       on offer, and in every search
//   matched    part of a proposed swap chain (chainId) - out of every search
//              until the chain either happens or ends; then open again
//   fulfilled  the chain happened: the shift has changed hands
//   cancelled  withdrawn by the person who offered it
//
// Expiry is derived rather than timed: once the shift has started, the
// request is treated as expired whenever it is read. No timers - the free
// tier sleeps, and a timer that never fires is worse than none. That is why
// the shift's start is copied here, where every query can filter on it.

import mongoose from 'mongoose';
import { SWAP_NOTE_MAX_LENGTH, SHIFT_CATEGORIES } from '../config/swaps.js';

const swapRequestSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true },

    // Who is giving the shift away. Always the shift's own holder.
    membershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', required: true },

    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    rosterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roster', required: true },
    startsAt: { type: Date, required: true },

    note: { type: String, trim: true, maxlength: SWAP_NOTE_MAX_LENGTH, default: '' },

    // What the person would take in return: kinds of shift, and weekdays
    // (0 = Sunday) in the organisation's timezone. An empty list means any.
    acceptableShiftFilters: {
      categories: { type: [{ type: String, enum: SHIFT_CATEGORIES }], default: [] },
      daysOfWeek: { type: [{ type: Number, min: 0, max: 6 }], default: [] },
    },

    status: { type: String, enum: ['open', 'matched', 'fulfilled', 'cancelled'], default: 'open' },
    cancelledAt: { type: Date, default: null },

    // The proposed chain this offer is part of, while it is matched.
    chainId: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapChain', default: null },
  },
  { timestamps: true },
);

// The open offers in an organisation that have not started yet: the
// finder's whole input, and every list.
swapRequestSchema.index({ orgId: 1, status: 1, startsAt: 1 });

// One open request per shift, enforced by the database, so two clicks at the
// same moment cannot both create one. A matched request is never open at
// the same time as another: offering refuses while one is matched
// (createSwapRequest.service.js), and only its chain ending reopens it.
swapRequestSchema.index({ assignmentId: 1 }, { unique: true, partialFilterExpression: { status: 'open' } });

export const SwapRequest = mongoose.models.SwapRequest ?? mongoose.model('SwapRequest', swapRequestSchema);

export default SwapRequest;
