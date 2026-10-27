// deactivateMembership.js
// The steps that take one membership out of its organisation, shared by a
// manager's Deactivate (deactivateMember.service.js) and a deleted sign-in
// (identity/deleteIdentity.service.js).
//
// In one transaction: refuse if it is the organisation's last active owner
// (ownerGuard.js), set it inactive, and turn its shifts on DRAFT rosters
// into unfilled slots (draftShifts.js) - a draft still being planned must
// not quietly roster someone who can no longer work. Published rosters keep
// them, as history. Afterwards they no longer count in the team average.
//
// Returns how many draft shifts came off.

import mongoose from 'mongoose';
import { Membership, User } from '../../models/index.js';
import { MEMBERSHIP_STATUS, ROLES } from '../../config/constants.js';
import { refreshLedgerSafely } from '../fairness/index.js';
import { assertAnotherOwner } from './ownerGuard.js';
import { clearDraftShifts } from './draftShifts.js';

export async function deactivateMembership(member) {
  const user = await User.findById(member.userId).select('name').lean();
  const session = await mongoose.startSession();
  let removedDraftShifts = 0;

  try {
    await session.withTransaction(async () => {
      if (member.role === ROLES.OWNER) await assertAnotherOwner({ orgId: member.orgId, membershipId: member._id, session });
      await Membership.updateOne({ _id: member._id }, { $set: { status: MEMBERSHIP_STATUS.INACTIVE } }, { session });
      removedDraftShifts = await clearDraftShifts({
        orgId: member.orgId,
        membershipId: member._id,
        name: user?.name ?? 'a team member',
        session,
      });
    });
  } finally {
    await session.endSession();
  }

  await refreshLedgerSafely(member.orgId);
  return removedDraftShifts;
}
