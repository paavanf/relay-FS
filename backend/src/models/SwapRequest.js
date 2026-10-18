// SwapRequest.js
// A worker offering one of their published shifts to whoever can take it.
//
// Each open request is one offer in the swap chain finder's graph. Looking
// for options never changes it; proposing, accepting and committing a chain
// arrive in the next milestone, along with the statuses they need.
//
// Expiry is derived rather than timed: once the shift has started, the
// request is treated as expired whenever it is read. No timers - the free
// tier sleeps, and a timer that never fires is worse than none. That is why
// the shift's start is copied here, where every query can filter on it.

import mongoose from 'mongoose';
import { SWAP_NOTE_MAX_LENGTH } from '../config/swaps.js';

const swapRequestSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true },

    // Who is giving the shift away. Always the shift's own holder.
    membershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', required: true },

    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    rosterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roster', required: true },
    startsAt: { type: Date, required: true },

    note: { type: String, trim: true, maxlength: SWAP_NOTE_MAX_LENGTH, default: '' },

    status: { type: String, enum: ['open', 'cancelled'], default: 'open' },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// The open offers in an organisation that have not started yet: the
// finder's whole input, and every list.
swapRequestSchema.index({ orgId: 1, status: 1, startsAt: 1 });

// One open request per shift, enforced by the database, so two clicks at the
// same moment cannot both create one.
swapRequestSchema.index({ assignmentId: 1 }, { unique: true, partialFilterExpression: { status: 'open' } });

export const SwapRequest = mongoose.models.SwapRequest ?? mongoose.model('SwapRequest', swapRequestSchema);

export default SwapRequest;
