// writeSwapProposals.js
// Two proposed swaps, so every state a swap passes through can be seen
// straight after seeding (Milestone 8):
//
//   waiting   proposed, and waiting for the other person to accept
//   approval  accepted by both, and waiting for a manager to approve
//
// Made the way people make them: an offer from each person, then the real
// reservation (reserveChain.js) and acceptance (acceptChain) code, so they
// are exactly what the app would have stored - reservations, audit entries
// and notifications included. Each proposal is the engine's direct swap for
// its pair. Their offers become matched, which takes them out of every
// search, so the swap cases (swapCases.js) still answer as proven.

import { Membership, Organisation, Roster, Assignment, SwapRequest } from '../../src/models/index.js';
import { findSwapOptions } from '../../src/engine/index.js';
import { loadOrgSchedulingData, toEngineContext } from '../../src/services/roster/orgSchedulingData.service.js';
import { toEngineAssignment } from '../../src/services/roster/toEngineAssignment.js';
import { loadSwapSearch } from '../../src/services/swap/loadSwapSearch.service.js';
import { reserveChain } from '../../src/services/swapChain/reserveChain.js';
import { acceptChain } from '../../src/services/swapChain/index.js';
import { DEFAULT_SWAP_POLICY } from '../../src/config/swaps.js';
import { demoId, DEMO_ORG_ID } from './ids.js';
import { datesAhead } from './dates.js';
import { pickProposalPairs } from './proposalPairs.js';

const NOTES = ['Dentist that morning.', 'Would rather work the weekend.', 'Picking my sister up from the airport.', 'Happy to swap.'];

async function offer(assignment, n) {
  const stored = await Assignment.findById(assignment.id).lean();
  const request = await SwapRequest.create({
    _id: demoId('swapRequest', n),
    orgId: DEMO_ORG_ID,
    membershipId: stored.membershipId,
    assignmentId: stored._id,
    rosterId: stored.rosterId,
    startsAt: stored.startsAt,
    note: NOTES[n % NOTES.length],
  });
  return request.toObject();
}

// The direct swap between the two offers, reserved as proposing it would - by the first person.
async function propose([mine, theirs], { policy, now }) {
  const input = await loadSwapSearch({ orgId: DEMO_ORG_ID, request: mine, now });
  const offers = input.offers.filter((o) => o.id === String(theirs._id));
  const [option] = findSwapOptions({ ...input, offers }).direct;
  if (!option) throw new Error('A demo proposal is no longer a legal swap.');
  return reserveChain({ orgId: DEMO_ORG_ID, proposerId: String(mine.membershipId), option, input: { ...input, offers }, policy, now });
}

export async function writeSwapProposals({ anchor, now }) {
  const org = await Organisation.findById(DEMO_ORG_ID).lean();
  const data = await loadOrgSchedulingData(org);
  const published = await Roster.find({ orgId: DEMO_ORG_ID, status: 'published' }).select('_id').lean();
  const stored = await Assignment.find({ orgId: DEMO_ORG_ID, rosterId: { $in: published.map((r) => r._id) } }).lean();
  const offering = await SwapRequest.find({ orgId: DEMO_ORG_ID }).select('membershipId').lean();

  const pairs = pickProposalPairs({
    assignments: stored.map(toEngineAssignment),
    context: toEngineContext(data),
    dates: datesAhead(anchor),
    leaveOut: new Set(offering.map((r) => String(r.membershipId))),
  });

  const policy = { ...DEFAULT_SWAP_POLICY, ...org.swapPolicy };
  const first = offering.length + 1;
  const [waiting, approval] = [
    [await offer(pairs[0][0], first), await offer(pairs[0][1], first + 1)],
    [await offer(pairs[1][0], first + 2), await offer(pairs[1][1], first + 3)],
  ];

  const waitingChain = await propose(waiting, { policy, now });
  const approvalChain = await propose(approval, { policy, now });
  const partner = await Membership.findById(approval[1].membershipId).lean();
  await acceptChain({ orgId: DEMO_ORG_ID, membership: partner, chainId: approvalChain._id, now });

  return {
    waiting: { proposer: waiting[0].membershipId, partner: waiting[1].membershipId, expiresAt: waitingChain.expiresAt },
    approval: { people: approval.map((r) => r.membershipId), expiresAt: approvalChain.expiresAt },
  };
}
