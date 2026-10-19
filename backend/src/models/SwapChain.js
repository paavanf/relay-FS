// SwapChain.js
// A proposed swap (Milestone 8): people who each give one published shift
// and take the next person's. Two people is a direct swap.
//
// One leg per person, in chain order - each takes the next one's shift, and
// the last takes the first one's. A leg stores the version of the shift it
// gives as it was when the chain was proposed: the commit refuses if that
// shift has changed since.
//
// The status only ever moves through engine/swaps/chainStateMachine.js, and
// every write names the revision it read, so of two requests deciding at
// the same moment exactly one wins. Expiry is a stored time, never a timer.

import mongoose from 'mongoose';
import { CHAIN_STATUSES } from '../engine/index.js';

const { ObjectId } = mongoose.Schema.Types;

const legSchema = new mongoose.Schema(
  {
    membershipId: { type: ObjectId, ref: 'Membership', required: true },
    swapRequestId: { type: ObjectId, ref: 'SwapRequest', required: true },
    givesAssignmentId: { type: ObjectId, ref: 'Assignment', required: true },
    givesVersion: { type: Number, required: true },
    receivesAssignmentId: { type: ObjectId, ref: 'Assignment', required: true },
    // The proposer's leg is accepted from the start.
    acceptedAt: { type: Date, default: null },
  },
  { _id: false },
);

const swapChainSchema = new mongoose.Schema(
  {
    orgId: { type: ObjectId, ref: 'Organisation', required: true },
    proposerId: { type: ObjectId, ref: 'Membership', required: true },

    // The option's identity in the finder (its offer ids, rotated to start
    // from the smallest), as the proposer chose it.
    optionKey: { type: String, required: true },

    status: { type: String, enum: CHAIN_STATUSES, default: 'proposed' },
    revision: { type: Number, default: 0 },
    legs: { type: [legSchema], required: true },

    // Copied from the organisation's swap rules when proposed, so changing
    // the rules never changes a swap already under way.
    requiresApproval: { type: Boolean, required: true },
    expiresAt: { type: Date, required: true },

    // True while the chain holds its shifts; false once it has ended.
    reservationsHeld: { type: Boolean, default: true },

    // How it ended: the action ('accept', 'approve', 'decline', 'cancel',
    // 'reject', 'expire') and who took it (none for an expiry).
    endedBy: {
      action: { type: String, default: null },
      membershipId: { type: ObjectId, ref: 'Membership', default: null },
    },
    endedAt: { type: Date, default: null },
    failureReason: { type: String, default: null },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true },
);

// One organisation's chains by status, oldest deadline first: lists, the
// approvals queue, and finding chains whose time has passed.
swapChainSchema.index({ orgId: 1, status: 1, expiresAt: 1 });
// The chains someone is in.
swapChainSchema.index({ 'legs.membershipId': 1, status: 1 });
// The reaper's sweep across every organisation.
swapChainSchema.index({ status: 1, expiresAt: 1 });

export const SwapChain = mongoose.models.SwapChain ?? mongoose.model('SwapChain', swapChainSchema);

export default SwapChain;
