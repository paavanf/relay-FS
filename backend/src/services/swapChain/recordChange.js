// recordChange.js
// What a change to a swap chain leaves behind, written in the same
// transaction as the change itself: an audit entry for each thing that
// happened, and a notification for each person who needs to know.
//
// Approving is recorded as two things - approved, then committed - and the
// last acceptance on a chain that needs approval as accepted, then waiting
// for approval, so the history reads the way it happened.

import { Membership, Notification, AuditLog } from '../../models/index.js';
import { MANAGER_ROLES, MEMBERSHIP_STATUS } from '../../config/constants.js';
import { namesOf } from '../member/memberNames.js';
import { shiftsById } from '../swap/describeShifts.js';
import { noticesFor } from './chainNotices.js';

/** What happened, from the event the state machine applied and where the chain ended up. */
export function kindsOf(applied, chain) {
  switch (applied) {
    case 'propose':
      return ['proposed'];
    case 'accept':
      return chain.status === 'awaiting_approval' ? ['accepted', 'awaiting_approval'] : ['accepted'];
    case 'decline':
      return ['declined'];
    case 'cancel':
      return ['cancelled'];
    case 'reject':
      return ['rejected'];
    case 'expire':
      return ['expired'];
    case 'commitFailed':
      return ['failed'];
    case 'committed':
      return chain.endedBy?.action === 'approve' ? ['approved', 'committed'] : ['committed'];
    default:
      return [];
  }
}

async function managersOf(orgId) {
  const managers = await Membership.find({ orgId, role: { $in: MANAGER_ROLES }, status: MEMBERSHIP_STATUS.ACTIVE })
    .select('_id')
    .lean();
  return managers.map((m) => String(m._id));
}

/** chain: the stored chain after the change; applied: the event the state machine applied. */
export async function recordChange({ chain, applied, actorId = null, session }) {
  const kinds = kindsOf(applied, chain);
  if (kinds.length === 0) return;
  const reason = chain.failureReason ?? chain.rejectionReason ?? null;

  await AuditLog.insertMany(
    kinds.map((kind) => ({ orgId: chain.orgId, actorId, action: `swap.${kind}`, chainId: chain._id, details: reason ? { reason } : {} })),
    { session },
  );

  const people = chain.legs.map((leg) => leg.membershipId);
  const [names, shifts, managerIds] = await Promise.all([
    namesOf(actorId ? [...people, actorId] : people),
    shiftsById(chain.legs.map((leg) => leg.givesAssignmentId)),
    kinds.includes('awaiting_approval') ? managersOf(chain.orgId) : [],
  ]);

  const facts = { chain, actorId, names, shifts, managerIds, reason };
  const notices = kinds.flatMap((kind) => noticesFor(kind, facts));
  if (notices.length > 0) await Notification.insertMany(notices, { session });
}
