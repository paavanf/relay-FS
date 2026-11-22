// generationClaim.js
// One generation per organisation at a time, decided by the database: the
// organisation is claimed in a single atomic update, so of two requests
// arriving together exactly one wins - on one server or several. No index is
// needed for it, which matters: production builds none automatically
// (config/db.js).
//
// A claim lasts as long as the longest a run can take
// (GENERATION_DEADLINE_MS). An older one belongs to a run whose server
// stopped part-way, and is taken over: nothing blocks an organisation for good.

import { Organisation } from '../../models/index.js';
import { GENERATION_DEADLINE_MS } from '../../config/constants.js';

/** Claims the organisation for a run starting at `now`. Resolves to the organisation, or null while another run holds it. */
export function claimGeneration(orgId, now) {
  const abandoned = new Date(now.getTime() - GENERATION_DEADLINE_MS);
  return Organisation.findOneAndUpdate(
    { _id: orgId, $or: [{ generationStartedAt: null }, { generationStartedAt: { $lte: abandoned } }] },
    { $set: { generationStartedAt: now } },
    { new: true },
  ).lean();
}

/** Ends the claim a run made - only that one: a newer run's claim is left alone. */
export function releaseGeneration(orgId, claimedAt) {
  return Organisation.updateOne({ _id: orgId, generationStartedAt: claimedAt }, { $set: { generationStartedAt: null } });
}
