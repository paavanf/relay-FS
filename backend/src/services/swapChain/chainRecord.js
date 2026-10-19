// chainRecord.js
// Between a stored SwapChain and the plain chain the state machine reads:
// toMachine() makes the plain one, and saveTransition() stores what the
// state machine decided - but only if the chain is still exactly as it was
// when it was read.
//
// That condition is the whole concurrency story for chains. Every write
// names the status and revision it read; if another request has moved the
// chain in between, nothing is written, and the caller reads it again and
// decides afresh. So of two people making the final acceptance at the same
// moment, exactly one moves the chain on - and a chain is never committed
// twice.

import { SwapChain } from '../../models/index.js';

const idOrNull = (id) => (id ? String(id) : null);

/** The plain chain engine/swaps/chainStateMachine.js works on. */
export function toMachine(doc) {
  return {
    status: doc.status,
    proposerId: String(doc.proposerId),
    requiresApproval: doc.requiresApproval,
    expiresAt: doc.expiresAt,
    reservationsHeld: doc.reservationsHeld,
    approvedBy: null,
    endedBy: doc.endedBy?.action ? { action: doc.endedBy.action, membershipId: idOrNull(doc.endedBy.membershipId) } : null,
    endedAt: doc.endedAt ?? null,
    failureReason: doc.failureReason ?? null,
    rejectionReason: doc.rejectionReason ?? null,
    legs: doc.legs.map((leg) => ({ membershipId: String(leg.membershipId), acceptedAt: leg.acceptedAt ?? null })),
  };
}

/**
 * Stores the state machine's decision about `doc`. Returns the chain as
 * stored, or null if it had moved since `doc` was read - then nothing is
 * written.
 */
export function saveTransition(doc, next, { session } = {}) {
  return SwapChain.findOneAndUpdate(
    { _id: doc._id, status: doc.status, revision: doc.revision },
    {
      $set: {
        status: next.status,
        reservationsHeld: next.reservationsHeld,
        legs: doc.legs.map((leg, i) => ({ ...leg, acceptedAt: next.legs[i].acceptedAt })),
        endedBy: next.endedBy ?? { action: null, membershipId: null },
        endedAt: next.endedAt ?? null,
        failureReason: next.failureReason ?? null,
        rejectionReason: next.rejectionReason ?? null,
      },
      $inc: { revision: 1 },
    },
    { new: true, session, lean: true },
  );
}
