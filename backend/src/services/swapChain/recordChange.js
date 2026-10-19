// recordChange.js
// The audit entry a change to a swap chain leaves behind - one for each thing
// that happened (changeKinds.js) - written in the same transaction as the
// change itself, so the record and the change can never disagree.
//
// Notifications are not written here. They go out once the change is saved
// (notification/notifyChain.js), best-effort, so a notification that cannot
// be written never undoes a swap.

import { AuditLog } from '../../models/index.js';
import { kindsOf } from './changeKinds.js';

/** chain: the stored chain after the change; applied: the event the state machine applied. */
export async function recordChange({ chain, applied, actorId = null, session }) {
  const kinds = kindsOf(applied, chain);
  if (kinds.length === 0) return;
  const reason = chain.failureReason ?? chain.rejectionReason ?? null;

  await AuditLog.insertMany(
    kinds.map((kind) => ({ orgId: chain.orgId, actorId, action: `swap.${kind}`, chainId: chain._id, details: reason ? { reason } : {} })),
    { session },
  );
}
