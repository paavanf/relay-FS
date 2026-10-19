// readChains.service.js
// Reading swap chains: the list someone may see, one chain, and the counts
// behind the sidebar badge. Every read first expires any chain whose time
// has run out, so nobody is shown a proposal that can no longer happen -
// and its shifts are let go on the spot.
//
//   workers    the chains they are in
//   managers   every chain in the organisation, newest first

import { SwapChain } from '../../models/index.js';
import { isManagerRole } from '../../utils/roles.js';
import { expireDueChains } from './expireDueChains.js';
import { findVisibleChain } from './findVisibleChain.js';
import { describeChains, describeChain } from './chainDto.js';

const LIST_LIMIT = 100;

export async function listChains({ orgId, membership, now = new Date() }) {
  await expireDueChains({ orgId, now });

  const filter = { orgId };
  if (!isManagerRole(membership.role)) filter['legs.membershipId'] = membership._id;
  const chains = await SwapChain.find(filter).sort({ createdAt: -1 }).limit(LIST_LIMIT).lean();
  return describeChains(chains, membership, now);
}

export async function getChain({ orgId, membership, chainId, now = new Date() }) {
  await findVisibleChain({ orgId, membership, chainId });
  await expireDueChains({ orgId, now });
  return describeChain(await findVisibleChain({ orgId, membership, chainId }), membership, now);
}

/** { waitingForYou, awaitingApproval } - chains that need this person to act; the second only for managers. */
export async function chainSummary({ orgId, membership, now = new Date() }) {
  await expireDueChains({ orgId, now });

  const waitingForYou = await SwapChain.countDocuments({
    orgId,
    status: 'proposed',
    expiresAt: { $gt: now },
    legs: { $elemMatch: { membershipId: membership._id, acceptedAt: null } },
  });
  const awaitingApproval = isManagerRole(membership.role)
    ? await SwapChain.countDocuments({ orgId, status: 'awaiting_approval', expiresAt: { $gt: now } })
    : 0;
  return { waitingForYou, awaitingApproval };
}
