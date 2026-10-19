// writeSwapRequests.js
// Stores the demo's open swap requests - picked and proved by swapCases.js -
// under fixed ids, as offering a shift on My Shifts would store them: note,
// "what I'd take in return" and all. Six shifts from the weeks ahead are on
// offer; four of the requests are the cases to look at (a chain only a
// filter forces, a direct swap, no options for Grace, and no options for a
// charge nurse's shift).
//
// The search works on what the options endpoint would load: published
// shifts, and the same scheduling data the generator and manual edits use.

import { Organisation, Roster, Assignment, SwapRequest } from '../../src/models/index.js';
import { loadOrgSchedulingData, toEngineContext } from '../../src/services/roster/orgSchedulingData.service.js';
import { toEngineAssignment } from '../../src/services/roster/toEngineAssignment.js';
import { DEFAULT_SWAP_POLICY } from '../../src/config/swaps.js';
import { demoId, DEMO_ORG_ID } from './ids.js';
import { datesAhead } from './dates.js';
import { PEOPLE } from './ward.js';
import { membershipIdOf, qualificationIdOf } from './wardDocs.js';
import { pickSwapCases } from './swapCases.js';

// A note for each offer by its place in the pool: [chain, y, z, w, role, grace].
const notes = (only) => [
  `Family wedding that weekend - I can only take ${only} shifts in return.`,
  'Would like this one off if it helps anyone.',
  'Swapping to get a long weekend.',
  'Open to swapping.',
  'Course day - I need someone to cover the charge nurse role.',
  'Childcare fell through that day.',
];

export async function writeSwapRequests({ anchor }) {
  const org = await Organisation.findById(DEMO_ORG_ID).lean();
  const data = await loadOrgSchedulingData(org);
  const published = await Roster.find({ orgId: DEMO_ORG_ID, status: 'published' }).select('_id').lean();
  const stored = await Assignment.find({ orgId: DEMO_ORG_ID, rosterId: { $in: published.map((r) => r._id) } }).lean();

  const cases = pickSwapCases({
    assignments: stored.map(toEngineAssignment),
    context: toEngineContext(data),
    dates: datesAhead(anchor),
    maxLength: org.swapPolicy?.maxChainLength ?? DEFAULT_SWAP_POLICY.maxChainLength,
    nurses: new Set(PEOPLE.filter((p) => p.qualifications.includes('rn')).map((p) => String(membershipIdOf(p.key)))),
    grace: String(membershipIdOf('grace')),
    chargeNurseRole: String(qualificationIdOf('cn')),
  });

  const byId = new Map(stored.map((a) => [String(a._id), a]));
  const note = notes(cases.chain.filters.categories[0]);
  await SwapRequest.insertMany(
    cases.pool.map((offer, i) => {
      const assignment = byId.get(offer.assignmentId);
      return {
        _id: demoId('swapRequest', i + 1),
        orgId: DEMO_ORG_ID,
        membershipId: assignment.membershipId,
        assignmentId: assignment._id,
        rosterId: assignment.rosterId,
        startsAt: assignment.startsAt,
        note: note[i],
        acceptableShiftFilters: offer.filters ?? { categories: [], daysOfWeek: [] },
        status: 'open',
      };
    }),
  );

  // For the summary: who to sign in as for each case, their shift, and how long the cases last.
  const describe = (offer) => ({ membershipId: offer.membershipId, assignment: byId.get(offer.assignmentId), filters: offer.filters });
  return {
    offered: cases.pool.length,
    openUntil: cases.openUntil,
    ...Object.fromEntries(['chain', 'direct', 'none', 'role'].map((kind) => [kind, describe(cases[kind])])),
  };
}
