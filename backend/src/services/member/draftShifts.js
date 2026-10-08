// draftShifts.js
// Takes one person's shifts off every DRAFT roster, and leaves each one behind
// as an unfilled slot with a plain reason.
//
// Just deleting them would be worse than it sounds: the grid's coverage row
// counts what was required as filled plus unfilled, so a deleted shift would
// make the roster look as if it had never been needed. Recording it as
// unfilled keeps the hole visible until someone fills it (or regenerates).
// Published rosters are not touched - changing those is a swap.

import { Assignment, Roster } from '../../models/index.js';

export async function clearDraftShifts({ orgId, membershipId, name, session }) {
  const drafts = await Roster.find({ orgId, status: 'draft' }).select('_id').session(session).lean();
  if (drafts.length === 0) return 0;

  const shifts = await Assignment.find({ orgId, membershipId, rosterId: { $in: drafts.map((d) => d._id) } })
    .session(session)
    .lean();
  if (shifts.length === 0) return 0;

  await Assignment.deleteMany({ _id: { $in: shifts.map((s) => s._id) } }, { session });

  const holesByRoster = new Map();
  for (const shift of shifts) {
    const key = String(shift.rosterId);
    if (!holesByRoster.has(key)) holesByRoster.set(key, []);
    holesByRoster.get(key).push({
      slotId: `left-${shift._id}`,
      date: shift.date,
      shiftTemplateId: shift.shiftTemplateId,
      qualifiedCount: 0,
      blockedBy: {},
      reason: `Nobody is on this shift since ${name} left the team.`,
    });
  }

  for (const [rosterId, holes] of holesByRoster) {
    await Roster.updateOne({ _id: rosterId }, { $push: { unfilledSlots: { $each: holes } } }, { session });
  }

  return shifts.length;
}
