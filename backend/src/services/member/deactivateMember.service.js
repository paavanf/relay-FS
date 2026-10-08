// deactivateMember.service.js
// Takes someone out of the organisation without erasing them.
//
// Never a hard delete: their past shifts belong to rosters people relied on,
// so the membership is set inactive and every record stays readable. From then
// on they are left out of generation and fairness, the Team page no longer
// lists them, and resolveMembership shuts them out of this organisation.
//
// Their shifts on DRAFT rosters come off, each recorded as an unfilled slot
// (draftShifts.js) - a draft still being planned must not quietly roster
// someone who can no longer work. Published rosters keep them, as history.
//
// Who may: a manager can deactivate members; deactivating a manager or an
// owner takes an owner. The last active owner can never be deactivated.

import mongoose from 'mongoose';
import { Membership, User } from '../../models/index.js';
import { MEMBERSHIP_STATUS, ROLES } from '../../config/constants.js';
import { AppError } from '../../errors/AppError.js';
import { refreshLedgerSafely } from '../fairness/index.js';
import { assertAnotherOwner } from './ownerGuard.js';
import { clearDraftShifts } from './draftShifts.js';
import { memberById } from './memberDto.js';

export async function deactivateMember({ orgId, actor, membershipId }) {
  const member = await Membership.findOne({ _id: membershipId, orgId, status: MEMBERSHIP_STATUS.ACTIVE }).lean();
  if (!member) throw AppError.notFound('Member not found');

  if (member.role !== ROLES.MEMBER && actor.role !== ROLES.OWNER) {
    throw AppError.forbidden('Only an owner can deactivate a manager or an owner.');
  }

  const user = await User.findById(member.userId).select('name').lean();
  const session = await mongoose.startSession();
  let removedDraftShifts = 0;

  try {
    await session.withTransaction(async () => {
      if (member.role === ROLES.OWNER) await assertAnotherOwner({ orgId, membershipId: member._id, session });
      await Membership.updateOne({ _id: member._id }, { $set: { status: MEMBERSHIP_STATUS.INACTIVE } }, { session });
      removedDraftShifts = await clearDraftShifts({
        orgId,
        membershipId: member._id,
        name: user?.name ?? 'a team member',
        session,
      });
    });
  } finally {
    await session.endSession();
  }

  // They no longer count in the team average.
  await refreshLedgerSafely(orgId);

  return { member: await memberById(member._id), removedDraftShifts };
}
