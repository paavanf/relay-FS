// chainDto.js
// Swap chains as the API returns them. Built in bulk, so a list of chains
// costs a handful of queries rather than a few per chain.
//
//   legs           the hand-overs, shaped exactly like the finder's options
//                  ({ from, to, assignment }), so the same diagram and
//                  sentences draw a proposal as drew the option
//   participants   each person with what they give, what they take, where
//                  they stand (accepted, waiting or declined), and whether
//                  they are the person asking (isYou)
//   waitingForYou  the person asking has a leg still to accept
//
// Names only for the people in the chain - and the manager who decided it.

import { TERMINAL_CHAIN_STATUSES } from '../../engine/index.js';
import { namesOf } from '../member/memberNames.js';
import { shiftsById } from '../swap/describeShifts.js';

function stateOf(chain, leg) {
  if (leg.acceptedAt) return 'accepted';
  const declinedIt = chain.endedBy?.action === 'decline' && String(chain.endedBy.membershipId) === String(leg.membershipId);
  return declinedIt ? 'declined' : 'waiting';
}

function describeOne(chain, { names, shifts, viewer, now }) {
  const person = (id) => ({ membershipId: String(id), name: names.get(String(id)) ?? 'A team member' });
  const count = chain.legs.length;
  const mine = chain.legs.find((leg) => String(leg.membershipId) === String(viewer._id));
  const live = !TERMINAL_CHAIN_STATUSES.includes(chain.status) && new Date(chain.expiresAt) > now;

  return {
    id: String(chain._id),
    status: chain.status,
    size: count,
    createdAt: chain.createdAt,
    expiresAt: chain.expiresAt,
    endedAt: chain.endedAt ?? null,
    requiresApproval: chain.requiresApproval,
    proposer: person(chain.proposerId),
    legs: chain.legs.map((leg, i) => ({
      from: person(chain.legs[(i + 1) % count].membershipId),
      to: person(leg.membershipId),
      assignment: shifts.get(String(leg.receivesAssignmentId)) ?? null,
    })),
    participants: chain.legs.map((leg) => ({
      ...person(leg.membershipId),
      isYou: String(leg.membershipId) === String(viewer._id),
      state: stateOf(chain, leg),
      gives: shifts.get(String(leg.givesAssignmentId)) ?? null,
      receives: shifts.get(String(leg.receivesAssignmentId)) ?? null,
    })),
    youAreIn: Boolean(mine),
    youProposed: String(chain.proposerId) === String(viewer._id),
    waitingForYou: live && chain.status === 'proposed' && Boolean(mine) && !mine.acceptedAt,
    endedBy: chain.endedBy?.action
      ? { action: chain.endedBy.action, by: chain.endedBy.membershipId ? person(chain.endedBy.membershipId) : null }
      : null,
    failureReason: chain.failureReason ?? null,
    rejectionReason: chain.rejectionReason ?? null,
  };
}

export async function describeChains(chains, viewer, now = new Date()) {
  const people = chains.flatMap((c) => [c.proposerId, c.endedBy?.membershipId, ...c.legs.map((leg) => leg.membershipId)]);
  const [names, shifts] = await Promise.all([
    namesOf(people.filter(Boolean)),
    shiftsById(chains.flatMap((c) => c.legs.map((leg) => leg.givesAssignmentId))),
  ]);
  return chains.map((chain) => describeOne(chain, { names, shifts, viewer, now }));
}

export async function describeChain(chain, viewer, now = new Date()) {
  const [described] = await describeChains([chain], viewer, now);
  return described;
}
