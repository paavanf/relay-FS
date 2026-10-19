// chainStates.js
// The states a proposed swap chain can be in, and the small facts about a
// chain the state machine (chainStateMachine.js) asks about it.
//
// A chain, as the state machine sees it, is a plain object:
//   { status, proposerId, requiresApproval, expiresAt, reservationsHeld,
//     legs: [{ membershipId, acceptedAt }], approvedBy, endedBy, endedAt,
//     failureReason, rejectionReason }
// with one leg per person: the shift they give and the one they take.

export const CHAIN_STATUS = Object.freeze({
  PROPOSED: 'proposed',
  AWAITING_APPROVAL: 'awaiting_approval',
  COMMITTED: 'committed',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  FAILED: 'failed',
});

export const CHAIN_STATUSES = Object.freeze(Object.values(CHAIN_STATUS));

// Once here, a chain never moves again.
export const TERMINAL_CHAIN_STATUSES = Object.freeze([
  CHAIN_STATUS.COMMITTED,
  CHAIN_STATUS.DECLINED,
  CHAIN_STATUS.CANCELLED,
  CHAIN_STATUS.EXPIRED,
  CHAIN_STATUS.FAILED,
]);

export const isTerminal = (chain) => TERMINAL_CHAIN_STATUSES.includes(chain.status);

export const isParticipant = (chain, membershipId) => chain.legs.some((leg) => leg.membershipId === membershipId);

export const allAccepted = (chain) => chain.legs.every((leg) => Boolean(leg.acceptedAt));

export const isDue = (chain, now) => new Date(now).getTime() >= new Date(chain.expiresAt).getTime();

/**
 * Ready to commit: everyone has accepted and no approval is needed, or a
 * manager has just approved. Nothing else may become committed.
 */
export function readyToCommit(chain) {
  if (chain.status === CHAIN_STATUS.PROPOSED) return allAccepted(chain) && !chain.requiresApproval;
  return chain.status === CHAIN_STATUS.AWAITING_APPROVAL && Boolean(chain.approvedBy);
}

/** The chain ended: a terminal status, who ended it and how, and its shifts let go. */
export function ended(chain, status, endedBy, now, extra = {}) {
  return { ...chain, ...extra, status, endedBy, endedAt: now, reservationsHeld: false };
}

/** A refusal: nothing changes, and the code says why. */
export const refuse = (code, message) => ({ ok: false, code, message });

// Who may send what: only the people in a chain accept or decline (their
// own leg - the event names them), and only its proposer cancels it.
export function refusalForActor(chain, event) {
  if ((event.type === 'accept' || event.type === 'decline') && !isParticipant(chain, event.membershipId)) {
    return refuse('NOT_PARTICIPANT', 'Only the people in this swap can accept or decline it.');
  }
  if (event.type === 'cancel' && event.membershipId !== chain.proposerId) {
    return refuse('NOT_PROPOSER', 'Only the person who proposed this swap can cancel it.');
  }
  return null;
}

// Repeating the action that ended a chain - or accepting one that has
// happened - changes nothing and gives the same answer.
export function repeatsTheEnd(chain, event) {
  if (event.type === chain.endedBy?.action) return true;
  if (chain.status === CHAIN_STATUS.COMMITTED) return event.type === 'accept' || event.type === 'committed';
  return chain.status === CHAIN_STATUS.FAILED && event.type === 'commitFailed';
}

// Why each terminal state refuses whatever comes next.
export function refusalFor(chain) {
  switch (chain.status) {
    case CHAIN_STATUS.COMMITTED:
      return refuse('COMMITTED', 'This swap has already happened.');
    case CHAIN_STATUS.DECLINED:
      return chain.endedBy?.action === 'reject'
        ? refuse('REJECTED', 'A manager rejected this swap, so it is off.')
        : refuse('DECLINED', 'Someone in this swap declined it, so it is off.');
    case CHAIN_STATUS.CANCELLED:
      return refuse('CANCELLED', 'This swap proposal was cancelled.');
    case CHAIN_STATUS.EXPIRED:
      return refuse('EXPIRED', 'This swap proposal expired before it was completed.');
    default:
      return refuse('FAILED', `This swap could not be completed: ${chain.failureReason ?? 'something changed.'}`);
  }
}
