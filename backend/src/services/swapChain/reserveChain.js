// reserveChain.js
// Holds every shift in a chosen chain and creates the chain - all in one
// transaction, or nothing at all.
//
// One conditional update per shift: it succeeds only if no unexpired chain
// holds the shift AND it is the very version the search just checked. If
// any fails - somebody proposed a swap with that shift a moment ago, or it
// changed - the transaction rolls back every reservation made so far and
// the proposer is asked to search again. Two proposals racing for the same
// shift therefore cannot both win.
//
// The chain expires at the earlier of the organisation's acceptance window
// and the start of its earliest shift: a swap cannot complete once one of
// its shifts is under way.

import mongoose from 'mongoose';
import { Assignment, SwapChain, SwapRequest } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { inTransaction } from '../../utils/transaction.js';
import { optionKeyOf } from '../swap/optionKey.js';
import { recordChange } from './recordChange.js';

const HOUR_MS = 3_600_000;
const TAKEN = 'Someone has just proposed a swap with one of these shifts, or one of them has changed. Search again.';

// Version 0 also matches a shift saved before versions existed, which has none.
const versionIs = (version) => (version === 0 ? { $in: [0, null] } : version);

function legsFor({ option, input, proposerId, now }) {
  const offersById = new Map([input.request, ...input.offers].map((offer) => [offer.id, offer]));
  const cycle = option.offerIds.map((id) => offersById.get(id));

  return cycle.map((offer, i) => ({
    membershipId: offer.membershipId,
    swapRequestId: offer.id,
    givesAssignmentId: offer.assignmentId,
    givesVersion: input.versions.get(offer.assignmentId) ?? 0,
    receivesAssignmentId: cycle[(i + 1) % cycle.length].assignmentId,
    acceptedAt: offer.membershipId === proposerId ? now : null,
  }));
}

export async function reserveChain({ orgId, proposerId, option, input, policy, now }) {
  const legs = legsFor({ option, input, proposerId, now });
  const startOf = new Map(input.assignments.map((a) => [a.id, new Date(a.startsAt).getTime()]));
  const earliest = Math.min(...legs.map((leg) => startOf.get(leg.givesAssignmentId)));
  const expiresAt = new Date(Math.min(now.getTime() + policy.acceptanceWindowHours * HOUR_MS, earliest));
  const chainId = new mongoose.Types.ObjectId();

  return inTransaction(async (session) => {
    for (const leg of legs) {
      const held = await Assignment.updateOne(
        {
          _id: leg.givesAssignmentId,
          orgId,
          membershipId: leg.membershipId,
          version: versionIs(leg.givesVersion),
          $or: [{ reservedByChainId: null }, { reservationExpiresAt: { $lte: now } }],
        },
        { $set: { reservedByChainId: chainId, reservationExpiresAt: expiresAt } },
        { session },
      );
      if (held.matchedCount !== 1) throw AppError.conflict(TAKEN);
    }

    const requestIds = legs.map((leg) => leg.swapRequestId);
    const matched = await SwapRequest.updateMany({ _id: { $in: requestIds }, orgId, status: 'open' }, { $set: { status: 'matched', chainId } }, { session });
    if (matched.modifiedCount !== legs.length) throw AppError.conflict(TAKEN);

    const [created] = await SwapChain.create(
      [{ _id: chainId, orgId, proposerId, optionKey: optionKeyOf(option), legs, requiresApproval: policy.requireManagerApproval, expiresAt }],
      { session },
    );
    const chain = created.toObject();
    await recordChange({ chain, applied: 'propose', actorId: proposerId, session });
    return chain;
  });
}
