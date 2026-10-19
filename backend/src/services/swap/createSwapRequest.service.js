// createSwapRequest.service.js
// A worker offers one of their shifts. Five rules, all checked here rather
// than trusted from the page:
//
//   it is their own shift        nobody can offer someone else's
//   it is on a published roster  a draft is still being decided, not a promise
//   it has not started           a shift underway cannot be handed over
//   it records its role          one saved before roles were recorded can
//                                never be part of a swap (Milestone 8)
//   it is not already offered    one open offer per shift (and the database
//                                index stops two at the same moment) - nor
//                                part of a swap proposal already

import { Assignment, Roster, SwapRequest } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { describeRequests } from './swapRequestDto.js';
import { filtersOf } from './shiftFilters.js';
import { ROLELESS_SHIFT } from './optionKey.js';

const ALREADY_OFFERED = 'You have already offered this shift.';

export async function createSwapRequest({ orgId, membership, assignmentId, note = '', acceptableShiftFilters, now = new Date() }) {
  const assignment = await Assignment.findOne({ _id: assignmentId, orgId }).lean();
  if (!assignment) throw AppError.notFound('Shift not found');
  if (String(assignment.membershipId) !== String(membership._id)) {
    throw AppError.forbidden('You can only offer your own shifts.');
  }

  const roster = await Roster.findOne({ _id: assignment.rosterId, orgId }).select('status').lean();
  if (roster?.status !== 'published') throw AppError.conflict('Only shifts on a published roster can be offered.');
  if (assignment.startsAt <= now) throw AppError.conflict('This shift has already started, so it can no longer be offered.');
  if (!assignment.slotQualificationId) throw AppError.conflict(ROLELESS_SHIFT);
  if (await SwapRequest.exists({ assignmentId, status: { $in: ['open', 'matched'] } })) throw AppError.conflict(ALREADY_OFFERED);

  try {
    const request = await SwapRequest.create({
      orgId,
      membershipId: membership._id,
      assignmentId,
      rosterId: assignment.rosterId,
      startsAt: assignment.startsAt,
      note,
      acceptableShiftFilters: filtersOf(acceptableShiftFilters),
    });
    const [described] = await describeRequests([request.toObject()], membership);
    return described;
  } catch (err) {
    // Two offers of the same shift in the same instant: the index lets one through.
    if (err?.code === 11000) throw AppError.conflict(ALREADY_OFFERED);
    throw err;
  }
}
