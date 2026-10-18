// cancelSwapRequest.service.js
// Withdrawing an offer. Only the person who made it can - a manager can see
// every request, but taking back someone's offer is theirs to do.
//
// Cancelled rather than deleted, so the history of what was offered stays.

import { SwapRequest } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';

export async function cancelSwapRequest({ orgId, membership, requestId, now = new Date() }) {
  const request = await SwapRequest.findOne({ _id: requestId, orgId, status: 'open' });
  if (!request) throw AppError.notFound('Swap request not found');

  if (String(request.membershipId) !== String(membership._id)) {
    throw AppError.forbidden('Only the person who offered a shift can withdraw the offer.');
  }

  request.status = 'cancelled';
  request.cancelledAt = now;
  await request.save();
}
