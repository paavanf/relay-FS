// writeSwapRequests.js
// Stores the demo's open swap requests - picked and proved by swapCases.js -
// under fixed ids, as offering a shift on My Shifts would store them. A few
// people offer a shift from the weeks ahead; three of those requests are the
// cases to look at (a chain only, a direct swap, and none at all).
//
// The search works on what the options endpoint would load: published
// shifts, and the same scheduling data the generator and manual edits use.

import { Organisation, Roster, Assignment, SwapRequest } from '../../src/models/index.js';
import { loadOrgSchedulingData, toEngineContext } from '../../src/services/roster/orgSchedulingData.service.js';
import { toEngineAssignment } from '../../src/services/swap/loadSwapSearch.service.js';
import { DEFAULT_SWAP_POLICY } from '../../src/config/swaps.js';
import { demoId, DEMO_ORG_ID } from './ids.js';
import { datesAhead } from './dates.js';
import { PEOPLE } from './ward.js';
import { membershipIdOf, templateIdOf } from './wardDocs.js';
import { pickSwapCases } from './swapCases.js';

// A note for each offer by its place in the pool: the chain's three first,
// Grace's last, and any pair added for a direct swap in between.
const notes = (count) => [
  'Family wedding that weekend - happy to take any shift back.',
  'Would like this one off if it helps anyone.',
  'Swapping to get a long weekend.',
  ...['Course day - looking to swap like for like.', 'Open to swapping.'].slice(0, count - 4),
  'Childcare fell through that day.',
];

const idsOf = (filter) => new Set(PEOPLE.filter(filter).map((person) => String(membershipIdOf(person.key))));

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
    nurses: idsOf((person) => person.qualifications.includes('rn')),
    chargeNurses: idsOf((person) => person.qualifications.includes('cn')),
    grace: String(membershipIdOf('grace')),
    dayTemplateId: String(templateIdOf('day')),
  });

  const byId = new Map(stored.map((a) => [String(a._id), a]));
  const note = notes(cases.pool.length);
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
        status: 'open',
      };
    }),
  );

  // For the summary: who to sign in as for each case, and their shift.
  const describe = (offer) => ({ membershipId: offer.membershipId, assignment: byId.get(offer.assignmentId) });
  return { offered: cases.pool.length, chain: describe(cases.chain), direct: describe(cases.direct), none: describe(cases.none) };
}
