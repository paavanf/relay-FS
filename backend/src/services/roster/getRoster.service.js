// getRoster.service.js
// One roster with everything the grid needs to draw itself: the assignments,
// and the slots the generator could not fill.
//
// The unfilled slots come back with the roster rather than from a separate
// call, because a roster shown without its holes is the one thing this
// product must never do - a manager would publish it believing every shift
// was covered.

import { Roster, Assignment } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { toSummary } from './listRosters.service.js';

export async function getRoster({ orgId, rosterId, includeDrafts }) {
  const roster = await Roster.findOne({ _id: rosterId, orgId }).lean();
  if (!roster) throw AppError.notFound('Roster not found');

  // A worker asking for a draft gets the same answer as one asking for a
  // roster that does not exist - the status is not theirs to learn.
  if (!includeDrafts && roster.status !== 'published') {
    throw AppError.notFound('Roster not found');
  }

  const assignments = await Assignment.find({ rosterId: roster._id })
    .sort({ startsAt: 1 })
    .lean();

  return {
    roster: toSummary(roster),
    assignments: assignments.map(toAssignmentDto),
    unfilledSlots: (roster.unfilledSlots ?? []).map(toUnfilledDto),
  };
}

export function toAssignmentDto(assignment) {
  return {
    id: String(assignment._id),
    rosterId: String(assignment.rosterId),
    membershipId: String(assignment.membershipId),
    shiftTemplateId: String(assignment.shiftTemplateId),
    date: assignment.date,
    startsAt: assignment.startsAt.toISOString(),
    endsAt: assignment.endsAt.toISOString(),
    source: assignment.source,
  };
}

function toUnfilledDto(slot) {
  return {
    slotId: slot.slotId,
    date: slot.date,
    shiftTemplateId: slot.shiftTemplateId ? String(slot.shiftTemplateId) : null,
    qualificationId: slot.qualificationId ? String(slot.qualificationId) : null,
    qualifiedCount: slot.qualifiedCount,
    // Stored as a Map, which does not survive JSON on its own.
    blockedBy: slot.blockedBy ? Object.fromEntries(slot.blockedBy) : {},
    reason: slot.reason,
  };
}
