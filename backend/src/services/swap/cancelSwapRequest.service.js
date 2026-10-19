// cancelSwapRequest.service.js
// Withdrawing an offer. Only the person who made it can - a manager can see
// every request, but taking back someone's offer is theirs to do.
//
// Cancelled rather than deleted, so the history of what was offered stays.
// An offer that is part of a swap proposal stays until the proposal ends:
// the proposal holds its shift, and the way out is to decline or cancel it.
// The update is conditional on the offer still being open, so it cannot
// slip in just as a proposal matches it.

import { SwapRequest } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';

const IN_A_PROPOSAL = 'This shift is part of a swap proposal. Decline or cancel the proposal first.';

export async function cancelSwapRequest({ orgId, membership, requestId, now = new Date() }) {
  const request = await SwapRequest.findOne({ _id: requestId, orgId, status: { $in: ['open', 'matched'] } }).lean();
  if (!request) throw AppError.notFound('Swap request not found');

  if (String(request.membershipId) !== String(membership._id)) {
    throw AppError.forbidden('Only the person who offered a shift can withdraw the offer.');
  }
  if (request.status === 'matched') throw AppError.conflict(IN_A_PROPOSAL);

  const cancelled = await SwapRequest.updateOne({ _id: request._id, status: 'open' }, { $set: { status: 'cancelled', cancelledAt: now } });
  if (cancelled.modifiedCount !== 1) throw AppError.conflict(IN_A_PROPOSAL);
}
