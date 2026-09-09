// listRosters.service.js
// The organisation's rosters, newest first.
//
// Workers only ever see published ones. A draft is a work in progress - half
// a roster shown to the people in it causes exactly the sort of "am I working
// Tuesday?" confusion the product exists to prevent.

import { Roster } from '../../models/index.js';

export async function listRosters({ orgId, includeDrafts }) {
  const filter = includeDrafts ? { orgId } : { orgId, status: 'published' };

  const rosters = await Roster.find(filter).sort({ startDate: -1 }).lean();

  return rosters.map(toSummary);
}

// The list view never needs the unfilled slots, which can be long.
export function toSummary(roster) {
  return {
    id: String(roster._id),
    name: roster.name,
    startDate: roster.startDate,
    endDate: roster.endDate,
    status: roster.status,
    unfilledCount: (roster.unfilledSlots ?? []).length,
    publishedAt: roster.publishedAt,
  };
}
