// updateSwapRequest.service.js
// Changing an open offer: its note, or what its owner would take in return.
//
// Only the person who made the offer can, and only while its shift is still
// to come - an expired offer is out of every search, so changing it would
// mean nothing.

import { SwapRequest } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { describeRequests } from './swapRequestDto.js';
import { filtersOf } from './shiftFilters.js';

export async function updateSwapRequest({ orgId, membership, requestId, note, acceptableShiftFilters, now = new Date() }) {
  const request = await SwapRequest.findOne({ _id: requestId, orgId, status: 'open' });
  if (!request) throw AppError.notFound('Swap request not found');

  if (String(request.membershipId) !== String(membership._id)) {
    throw AppError.forbidden('Only the person who offered a shift can change the offer.');
  }
  if (request.startsAt <= now) throw AppError.conflict('This shift has already started, so the offer can no longer be changed.');

  if (note !== undefined) request.note = note;
  if (acceptableShiftFilters !== undefined) request.acceptableShiftFilters = filtersOf(acceptableShiftFilters);
  await request.save();

  const [described] = await describeRequests([request.toObject()], membership);
  return described;
}
