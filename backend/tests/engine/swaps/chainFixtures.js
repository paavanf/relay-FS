// chainFixtures.js
// Plain chains for the state machine tests: the shape services build from a
// stored SwapChain (services/swapChain/chainRecord.js), with people 'a',
// 'b', 'c' and a manager 'm'. 'a' proposed, so 'a' has accepted.
//
// NOW is before the chain's expiresAt; LATER is after it.

import { transition } from '../../../src/engine/index.js';

export const NOW = new Date('2026-03-10T09:00:00Z');
export const EXPIRES = new Date('2026-03-11T09:00:00Z');
export const LATER = new Date('2026-03-12T09:00:00Z');

export function chainOf({ people = ['a', 'b', 'c'], requiresApproval = true, ...rest } = {}) {
  return {
    status: 'proposed',
    proposerId: people[0],
    requiresApproval,
    expiresAt: EXPIRES,
    reservationsHeld: true,
    approvedBy: null,
    endedBy: null,
    endedAt: null,
    failureReason: null,
    rejectionReason: null,
    legs: people.map((membershipId, i) => ({ membershipId, acceptedAt: i === 0 ? NOW : null })),
    ...rest,
  };
}

/** The chain after a run of events, each applied to the result of the last - refusals change nothing. */
export function after(chain, events, now = NOW) {
  return events.reduce((current, event) => {
    const result = transition(current, event, now);
    return result.ok ? result.chain : current;
  }, chain);
}

export const accept = (membershipId) => ({ type: 'accept', membershipId });
export const decline = (membershipId) => ({ type: 'decline', membershipId });
export const cancel = (membershipId) => ({ type: 'cancel', membershipId });
export const approve = { type: 'approve', membershipId: 'm' };
export const reject = { type: 'reject', membershipId: 'm', reason: 'Not enough cover that night.' };
export const committed = { type: 'committed' };
export const commitFailed = { type: 'commitFailed', reason: 'one of its shifts has changed since the swap was proposed.' };
export const expire = { type: 'expire' };

// A chain in each state, reached the way the services reach it.
export const awaiting = () => after(chainOf(), [accept('b'), accept('c')]);
export const approvedAndCommitted = () => after(awaiting(), [approve, committed]);
export const acceptedAndCommitted = () => after(chainOf({ requiresApproval: false }), [accept('b'), accept('c'), committed]);
export const declined = () => after(chainOf(), [decline('b')]);
export const rejected = () => after(awaiting(), [reject]);
export const cancelled = () => after(chainOf(), [cancel('a')]);
export const expired = () => after(chainOf(), [expire], LATER);
export const failed = () => after(awaiting(), [approve, commitFailed]);
