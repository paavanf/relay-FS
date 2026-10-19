// getSwapOptions.service.js
// The options for one swap request: direct swaps, then longer chains, best
// first - or the reasons there are none.
//
// Looking is safe, on purpose: it never reserves a shift, proposes anything
// or tells anyone about the search. Proposing a chain is a separate write
// (swapChain/proposeChain.service.js). The one thing a look can change is
// a proposal whose time has already run out: like every read, it marks
// that expired first, so the shifts it held are back in the search.
//
// Only the requester and managers may look. Anyone else asking about a
// request gets the answer a request that does not exist would get. A shift
// saved before roles were recorded cannot be swapped at all, and the
// requester is told why.

import { SwapRequest, Membership, Assignment } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { MEMBERSHIP_STATUS } from '../../config/constants.js';
import { findSwapOptions } from '../../engine/index.js';
import { isManagerRole } from '../../utils/roles.js';
import { expireDueChains } from '../swapChain/expireDueChains.js';
import { loadSwapSearch } from './loadSwapSearch.service.js';
import { describeOptions } from './describeOptions.js';
import { ROLELESS_SHIFT } from './optionKey.js';

export async function getSwapOptions({ orgId, membership, requestId, now = new Date() }) {
  await expireDueChains({ orgId, now });
  const request = await SwapRequest.findOne({ _id: requestId, orgId, status: { $in: ['open', 'matched'] } }).lean();
  const isRequester = Boolean(request) && String(request.membershipId) === String(membership._id);
  if (!request || (!isRequester && !isManagerRole(membership.role))) throw AppError.notFound('Swap request not found');

  // A request left behind by someone no longer on the team cannot be swapped.
  const onTeam = await Membership.exists({ _id: request.membershipId, status: MEMBERSHIP_STATUS.ACTIVE });
  if (!onTeam) throw AppError.notFound('Swap request not found');
  if (request.status === 'matched') throw AppError.conflict('This shift is already part of a swap proposal.');
  if (request.startsAt <= now) throw AppError.conflict('This shift has already started, so it can no longer be swapped.');

  const own = await Assignment.findById(request.assignmentId).select('slotQualificationId').lean();
  if (!own?.slotQualificationId) throw AppError.conflict(ROLELESS_SHIFT);

  const input = await loadSwapSearch({ orgId, request, now });

  // The clock is injected here, at the edge, for the search's time budget:
  // the engine reads no clock of its own.
  const result = findSwapOptions({ ...input, now: Date.now });

  return describeOptions({ request, input, result, viewer: membership });
}
