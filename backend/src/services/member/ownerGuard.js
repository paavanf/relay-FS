// ownerGuard.js
// An organisation must always keep at least one active owner. Without one,
// nobody could ever change a role again.
//
// Runs inside the caller's transaction, and first WRITES to the organisation
// document. That write is the lock. Two owners demoting each other at the same
// moment would otherwise each see the other still in place, both succeed, and
// leave none. Because both transactions now write the same document, the
// second conflicts and retries - and on the retry it sees the first change.

import { Membership, Organisation } from '../../models/index.js';
import { MEMBERSHIP_STATUS, ROLES } from '../../config/constants.js';
import { AppError } from '../../errors/AppError.js';

export async function assertAnotherOwner({ orgId, membershipId, session }) {
  await Organisation.updateOne({ _id: orgId }, { $set: { updatedAt: new Date() } }, { session });

  const others = await Membership.countDocuments({
    orgId,
    role: ROLES.OWNER,
    status: MEMBERSHIP_STATUS.ACTIVE,
    _id: { $ne: membershipId },
  }).session(session);

  if (others === 0) {
    throw AppError.conflict('An organisation needs at least one owner. Make someone else an owner first.');
  }
}
