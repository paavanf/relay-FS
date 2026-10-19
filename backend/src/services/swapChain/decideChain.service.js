// decideChain.service.js
// A manager's decision on a swap everyone has accepted: approve it, which
// commits it (commitChain.service.js), or reject it, which ends it and
// lets its shifts go. Managers and owners only - the route says so.
//
// Approving twice is safe. The second approval of a committed chain gets
// the same success and changes nothing; two approvals at the same moment
// both see one commit, because the commit only moves a chain that is still
// exactly as it was read.

import { transition } from '../../engine/index.js';
import { applyChainEvent, storeThenNotify } from './applyChainEvent.js';
import { commitChain } from './commitChain.service.js';
import { toMachine } from './chainRecord.js';
import { findVisibleChain } from './findVisibleChain.js';
import { describeChain } from './chainDto.js';
import { refusalError, expiredError, failedError, refuseIfExpiredInstead } from './refusals.js';

export async function approveChain({ orgId, membership, chainId, now = new Date() }) {
  const doc = await findVisibleChain({ orgId, membership, chainId });
  const result = transition(toMachine(doc), { type: 'approve', membershipId: String(membership._id) }, now);
  if (!result.ok) throw refusalError(result);

  // Past its time: it expires instead, whatever the manager asked.
  if (result.applied === 'expire') {
    await storeThenNotify({ doc, result });
    throw expiredError();
  }

  // The same approval again gives the same answer as the first time.
  if (!result.changed) {
    if (doc.status === 'failed') throw failedError(doc);
    return describeChain(doc, membership, now);
  }

  const committed = await commitChain({ orgId, doc, ready: result.chain, actorId: membership._id, now });
  return describeChain(committed, membership, now);
}

export async function rejectChain({ orgId, membership, chainId, reason, now = new Date() }) {
  await findVisibleChain({ orgId, membership, chainId });
  const event = { type: 'reject', membershipId: String(membership._id), reason: reason || null };
  const { doc, result } = await applyChainEvent({ orgId, chainId, event, actorId: membership._id, now });
  refuseIfExpiredInstead(result, event.type);
  return describeChain(doc, membership, now);
}
