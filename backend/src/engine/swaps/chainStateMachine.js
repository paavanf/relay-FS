// chainStateMachine.js
// Every move a swap chain can make, decided in one pure function. Services
// never set a chain's status themselves: they ask transition() and store
// what it returns, or pass on its refusal. The full table is in the README.
//
//   transition(chain, event, now)
//     -> { ok: true, chain, changed, applied, commit }   the next chain
//     -> { ok: false, code, message }                     refused
//
// Events: accept, decline and cancel carry the person's membershipId;
// approve and reject the manager's; commitFailed a reason; expire and
// committed nothing. `applied` is the event that really happened - for a
// chain past its expiresAt, every event becomes `expire`. `commit` means
// the chain is ready to commit: the caller runs the commit, then sends
// `committed`, or `commitFailed` with what went wrong.
//
// A terminal chain never moves again. Repeating the action that ended it
// returns the same result and changes nothing, so a double click or a
// retried request is harmless. `now` is passed in: the engine reads no clock.

import { CHAIN_STATUS, isTerminal, allAccepted, isDue, readyToCommit, ended, refuse } from './chainStates.js';
import { refusalForActor, repeatsTheEnd, refusalFor } from './chainStates.js';

const unchanged = (chain, applied, commit = false) => ({ ok: true, chain, changed: false, applied, commit });
const moved = (chain, applied, commit = false) => ({ ok: true, chain, changed: true, applied, commit });

function accept(chain, { membershipId }, now) {
  // Accepting twice changes nothing. A chain ready to commit still says so,
  // which is how a commit cut short by a crash gets finished.
  if (chain.legs.find((leg) => leg.membershipId === membershipId).acceptedAt) {
    return unchanged(chain, 'accept', readyToCommit(chain));
  }

  const legs = chain.legs.map((leg) => (leg.membershipId === membershipId ? { ...leg, acceptedAt: now } : leg));
  const next = { ...chain, legs };
  if (!allAccepted(next)) return moved(next, 'accept');
  if (next.requiresApproval) return moved({ ...next, status: CHAIN_STATUS.AWAITING_APPROVAL }, 'accept');
  return moved(next, 'accept', true);
}

// What a manager approved, or the last acceptance, is what triggered the commit.
const commitTrigger = (chain) => (chain.status === CHAIN_STATUS.AWAITING_APPROVAL ? 'approve' : 'accept');

function decide(chain, event, now) {
  const by = { action: event.type, membershipId: event.membershipId ?? null };
  const awaiting = chain.status === CHAIN_STATUS.AWAITING_APPROVAL;

  switch (event.type) {
    case 'accept':
      return accept(chain, event, now);
    case 'decline':
      return moved(ended(chain, CHAIN_STATUS.DECLINED, by, now), 'decline');
    case 'cancel':
      return moved(ended(chain, CHAIN_STATUS.CANCELLED, by, now), 'cancel');
    case 'approve':
      if (!awaiting) return refuse('NOT_AWAITING_APPROVAL', 'Everyone in the swap has to accept it before a manager can approve it.');
      return moved({ ...chain, approvedBy: event.membershipId }, 'approve', true);
    case 'reject':
      if (!awaiting) return refuse('NOT_AWAITING_APPROVAL', 'Only a swap everyone has accepted can be rejected.');
      return moved(ended(chain, CHAIN_STATUS.DECLINED, by, now, { rejectionReason: event.reason ?? null }), 'reject');
    case 'expire':
      return refuse('NOT_DUE', 'This swap proposal has not expired yet.');
    case 'committed':
    case 'commitFailed': {
      if (!readyToCommit(chain)) return refuse('NOT_READY', 'This swap is not ready to be completed.');
      const trigger = { action: commitTrigger(chain), membershipId: chain.approvedBy ?? null };
      return event.type === 'committed'
        ? moved(ended(chain, CHAIN_STATUS.COMMITTED, trigger, now), 'committed')
        : moved(ended(chain, CHAIN_STATUS.FAILED, trigger, now, { failureReason: event.reason }), 'commitFailed');
    }
    default:
      return refuse('UNKNOWN_EVENT', `Unknown swap event: ${event.type}`);
  }
}

export function transition(chain, event, now) {
  const actorRefusal = refusalForActor(chain, event);
  if (actorRefusal) return actorRefusal;

  if (isTerminal(chain)) return repeatsTheEnd(chain, event) ? unchanged(chain, event.type) : refusalFor(chain);

  // Past its time, a chain expires - whatever was asked of it.
  if (isDue(chain, now)) return moved(ended(chain, CHAIN_STATUS.EXPIRED, { action: 'expire', membershipId: null }, now), 'expire');

  return decide(chain, event, now);
}
