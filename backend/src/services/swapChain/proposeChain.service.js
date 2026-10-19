// proposeChain.service.js
// A worker proposes one of the options found for their offer.
//
// The client's chain is never trusted. The options are searched again here
// from scratch, and the chosen one must still be among them - so it is
// still legal, by exactly the checks the finder makes - or the answer is
// "These options have changed — search again." A shift created before
// roles were recorded can never be part of a chain: the finder leaves such
// offers out, and one offered by the proposer is refused here.
//
// Then reserveChain.js holds every shift in it, in one transaction.

import { Assignment, Organisation, SwapRequest } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { findSwapOptions } from '../../engine/index.js';
import { isManagerRole } from '../../utils/roles.js';
import { DEFAULT_SWAP_POLICY } from '../../config/swaps.js';
import { loadSwapSearch } from '../swap/loadSwapSearch.service.js';
import { optionKeyOf, OPTIONS_CHANGED, ROLELESS_SHIFT } from '../swap/optionKey.js';
import { expireDueChains } from './expireDueChains.js';
import { reserveChain } from './reserveChain.js';
import { describeChain } from './chainDto.js';

async function offerToPropose({ orgId, membership, swapRequestId, now }) {
  const request = await SwapRequest.findOne({ _id: swapRequestId, orgId }).lean();
  const isOwner = Boolean(request) && String(request.membershipId) === String(membership._id);
  if (!request || (!isOwner && !isManagerRole(membership.role))) throw AppError.notFound('Swap request not found');

  if (!isOwner) throw AppError.forbidden('Only the person who offered this shift can propose a swap for it.');
  if (request.status === 'matched') throw AppError.conflict('This shift is already part of a swap proposal.');
  if (request.status !== 'open') throw AppError.conflict('This offer is no longer open.');
  if (request.startsAt <= now) throw AppError.conflict('This shift has already started, so it can no longer be swapped.');
  return request;
}

export async function proposeChain({ orgId, membership, swapRequestId, optionKey, now = new Date() }) {
  await expireDueChains({ orgId, now });
  const request = await offerToPropose({ orgId, membership, swapRequestId, now });

  const own = await Assignment.findById(request.assignmentId).select('slotQualificationId').lean();
  if (!own?.slotQualificationId) throw AppError.conflict(ROLELESS_SHIFT);

  // The same search as the options endpoint, with the clock injected at the edge for its time budget.
  const input = await loadSwapSearch({ orgId, request, now });
  const result = findSwapOptions({ ...input, now: Date.now });
  const option = [...result.direct, ...result.chains].find((candidate) => optionKeyOf(candidate) === optionKey);
  if (!option) throw AppError.conflict(OPTIONS_CHANGED);

  const org = await Organisation.findById(orgId).select('swapPolicy').lean();
  const policy = { ...DEFAULT_SWAP_POLICY, ...(org?.swapPolicy ?? {}) };
  const chain = await reserveChain({ orgId, proposerId: String(membership._id), option, input, policy, now });
  return describeChain(chain, membership, now);
}
