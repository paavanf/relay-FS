// findVisibleChain.js
// A swap chain someone may see: the people in it, and the organisation's
// managers. Anyone else asking gets the answer a chain that does not exist
// would get, so chain ids cannot be probed.

import { SwapChain } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { isManagerRole } from '../../utils/roles.js';

export const isInChain = (chain, membership) => chain.legs.some((leg) => String(leg.membershipId) === String(membership._id));

export async function findVisibleChain({ orgId, membership, chainId }) {
  const chain = await SwapChain.findOne({ _id: chainId, orgId }).lean();
  if (!chain || (!isInChain(chain, membership) && !isManagerRole(membership.role))) {
    throw AppError.notFound('Swap not found');
  }
  return chain;
}
