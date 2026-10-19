// respondToChain.service.js
// The people in a proposed swap answering it: accepting their own leg,
// declining - which ends it for everyone at once - or, for the proposer
// only, cancelling it. Each change goes through the state machine
// (applyChainEvent.js); a chain past its time expires instead, and the
// caller is told so.
//
// The last acceptance on a chain that needs no approval commits it there
// and then (commitChain.service.js). Two people accepting last at the same
// moment cannot both do that: their acceptances are written one at a time,
// so only the second finds every leg accepted - and the commit moves the
// chain only if it is still exactly as that request read it.

import { applyChainEvent } from './applyChainEvent.js';
import { commitChain } from './commitChain.service.js';
import { toMachine } from './chainRecord.js';
import { findVisibleChain } from './findVisibleChain.js';
import { describeChain } from './chainDto.js';
import { refuseIfExpiredInstead, failedError } from './refusals.js';

async function respond({ orgId, membership, chainId, event, now }) {
  await findVisibleChain({ orgId, membership, chainId });
  const { doc, result } = await applyChainEvent({ orgId, chainId, event, actorId: membership._id, now });
  refuseIfExpiredInstead(result, event.type);
  return { doc, result };
}

export async function acceptChain({ orgId, membership, chainId, now = new Date() }) {
  const event = { type: 'accept', membershipId: String(membership._id) };
  const { doc, result } = await respond({ orgId, membership, chainId, event, now });

  // Accepting again a chain whose commit failed gives the same answer as the first time.
  if (doc.status === 'failed') throw failedError(doc);
  const chain = result.commit ? await commitChain({ orgId, doc, ready: toMachine(doc), actorId: membership._id, now }) : doc;
  return describeChain(chain, membership, now);
}

export async function declineChain({ orgId, membership, chainId, now = new Date() }) {
  const event = { type: 'decline', membershipId: String(membership._id) };
  const { doc } = await respond({ orgId, membership, chainId, event, now });
  return describeChain(doc, membership, now);
}

export async function cancelChain({ orgId, membership, chainId, now = new Date() }) {
  const event = { type: 'cancel', membershipId: String(membership._id) };
  const { doc } = await respond({ orgId, membership, chainId, event, now });
  return describeChain(doc, membership, now);
}
