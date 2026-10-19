// swapRules.service.js
// Reads and writes an organisation's swap rules: how long a proposed swap
// waits for everyone to accept, whether a manager approves it, and the
// longest chain of people the finder suggests.
//
// All three are written together, like the roster rules: the validator
// requires every one, so a save can never leave a rule unset. A swap
// already proposed keeps the rules it was proposed under - its deadline
// and whether it needs approval are stored on the chain itself.

import { Organisation } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { DEFAULT_SWAP_POLICY } from '../../config/swaps.js';

const withDefaults = (swapPolicy) => ({
  acceptanceWindowHours: swapPolicy?.acceptanceWindowHours ?? DEFAULT_SWAP_POLICY.acceptanceWindowHours,
  requireManagerApproval: swapPolicy?.requireManagerApproval ?? DEFAULT_SWAP_POLICY.requireManagerApproval,
  maxChainLength: swapPolicy?.maxChainLength ?? DEFAULT_SWAP_POLICY.maxChainLength,
});

export async function getSwapRules(orgId) {
  const org = await Organisation.findById(orgId).select('swapPolicy').lean();
  if (!org) throw AppError.notFound('Organisation not found');
  return withDefaults(org.swapPolicy);
}

export async function updateSwapRules(orgId, rules) {
  const org = await Organisation.findByIdAndUpdate(
    orgId,
    {
      $set: {
        'swapPolicy.acceptanceWindowHours': rules.acceptanceWindowHours,
        'swapPolicy.requireManagerApproval': rules.requireManagerApproval,
        'swapPolicy.maxChainLength': rules.maxChainLength,
      },
    },
    { new: true, runValidators: true },
  )
    .select('swapPolicy')
    .lean();

  if (!org) throw AppError.notFound('Organisation not found');
  return withDefaults(org.swapPolicy);
}
