// getSwapOptions.service.js
// The options for one swap request: direct swaps, then longer chains, best
// first - or the reasons there are none.
//
// Read-only and side-effect free, on purpose. Looking never reserves a
// shift, notifies anyone or writes anything, which is what makes exploring
// safe. Proposing a chain (the next milestone) will be a separate write.
//
// Only the requester and managers may look. Anyone else asking about a
// request gets the answer a request that does not exist would get.

import { SwapRequest, Membership } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { MEMBERSHIP_STATUS } from '../../config/constants.js';
import { findSwapOptions } from '../../engine/index.js';
import { isManagerRole } from '../../utils/roles.js';
import { loadSwapSearch } from './loadSwapSearch.service.js';
import { describeOptions } from './describeOptions.js';

export async function getSwapOptions({ orgId, membership, requestId, now = new Date() }) {
  const request = await SwapRequest.findOne({ _id: requestId, orgId, status: 'open' }).lean();
  const isRequester = Boolean(request) && String(request.membershipId) === String(membership._id);
  if (!request || (!isRequester && !isManagerRole(membership.role))) throw AppError.notFound('Swap request not found');

  // A request left behind by someone no longer on the team cannot be swapped.
  const onTeam = await Membership.exists({ _id: request.membershipId, status: MEMBERSHIP_STATUS.ACTIVE });
  if (!onTeam) throw AppError.notFound('Swap request not found');
  if (request.startsAt <= now) throw AppError.conflict('This shift has already started, so it can no longer be swapped.');

  const input = await loadSwapSearch({ orgId, request, now });

  // The clock is injected here, at the edge, for the search's time budget:
  // the engine reads no clock of its own.
  const result = findSwapOptions({ ...input, now: Date.now });

  return describeOptions({ request, input, result, viewer: membership });
}
