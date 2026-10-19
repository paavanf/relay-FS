// publishedAround.js
// Every published shift within SWAP_SEARCH.contextDays of some given shifts:
// enough of each person's weeks for the constraint engine to judge rest,
// consecutive days and weekly hours after a swap. Drafts are proposals, not
// commitments, so they stay out.
//
// Used by the finder (for everyone) and by the commit and the approval
// preview (for just the people in one chain - `membershipIds`), inside the
// commit's transaction when it passes its session.

import { Roster, Assignment } from '../../models/index.js';
import { SWAP_SEARCH } from '../../config/swaps.js';

const DAY_MS = 86_400_000;

export async function publishedAround(orgId, shifts, { membershipIds, session } = {}) {
  if (shifts.length === 0) return [];
  const margin = SWAP_SEARCH.contextDays * DAY_MS;
  const from = new Date(Math.min(...shifts.map((a) => new Date(a.startsAt).getTime())) - margin);
  const to = new Date(Math.max(...shifts.map((a) => new Date(a.endsAt).getTime())) + margin);

  const rosters = Roster.find({ orgId, status: 'published' }).select('_id').lean();
  if (session) rosters.session(session);
  const filter = { orgId, rosterId: { $in: (await rosters).map((r) => r._id) }, startsAt: { $gte: from, $lte: to } };
  if (membershipIds) filter.membershipId = { $in: membershipIds };

  const assignments = Assignment.find(filter).lean();
  if (session) assignments.session(session);
  return assignments;
}
