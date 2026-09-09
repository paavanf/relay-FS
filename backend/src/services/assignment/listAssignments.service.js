// listAssignments.service.js
// Assignments in a date range, for the My Shifts page.
//
// Published rosters only. A draft is not a commitment, and showing someone a
// shift that might still be moved is worse than showing them nothing.
//
// Workers see only their own. That is enforced here rather than trusted from
// the query string: the caller says "mine", the server decides who "me" is.

import { Roster, Assignment } from '../../models/index.js';
import { toAssignmentDto } from '../roster/getRoster.service.js';

export async function listAssignments({ orgId, from, to, membershipId }) {
  const published = await Roster.find({ orgId, status: 'published' }).select('_id').lean();
  if (published.length === 0) return [];

  const assignments = await Assignment.find({
    orgId,
    rosterId: { $in: published.map((r) => r._id) },
    ...(membershipId ? { membershipId } : {}),
    // Compared on the local calendar date, so a night shift belongs to the day
    // it started rather than the day it happens to end in UTC.
    ...(from || to
      ? { date: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } }
      : {}),
  })
    .sort({ startsAt: 1 })
    .lean();

  return assignments.map(toAssignmentDto);
}
