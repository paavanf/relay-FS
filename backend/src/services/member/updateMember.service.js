// updateMember.service.js
// Changes one member's role, qualifications, employment type or contracted
// hours. Who may change what is decided here, never by the UI:
//
//   - only an owner can change roles, including making someone an owner
//   - the last active owner can never be demoted (ownerGuard.js)
//   - every qualification must belong to this organisation
//
// Contracted hours are what fairness normalises against, so changing them
// recomputes the ledger - and a failed recompute never fails the update.

import mongoose from 'mongoose';
import { Membership } from '../../models/index.js';
import { MEMBERSHIP_STATUS, ROLES } from '../../config/constants.js';
import { AppError } from '../../errors/AppError.js';
import { assertOwnQualifications } from '../qualification/assertOwnQualifications.js';
import { refreshLedgerSafely } from '../fairness/index.js';
import { assertAnotherOwner } from './ownerGuard.js';
import { memberById } from './memberDto.js';

export async function updateMember({ orgId, actor, membershipId, changes }) {
  const member = await Membership.findOne({ _id: membershipId, orgId, status: MEMBERSHIP_STATUS.ACTIVE }).lean();
  if (!member) throw AppError.notFound('Member not found');

  if (changes.role !== undefined && actor.role !== ROLES.OWNER) {
    throw AppError.forbidden('Only an owner can change roles.');
  }
  if (changes.qualificationIds) await assertOwnQualifications(orgId, changes.qualificationIds);

  const demotesAnOwner = member.role === ROLES.OWNER && changes.role !== undefined && changes.role !== ROLES.OWNER;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (demotesAnOwner) await assertAnotherOwner({ orgId, membershipId: member._id, session });
      await Membership.updateOne({ _id: member._id }, { $set: changes }, { session, runValidators: true });
    });
  } finally {
    await session.endSession();
  }

  const hoursChanged =
    changes.contractedHoursPerWeek !== undefined && changes.contractedHoursPerWeek !== member.contractedHoursPerWeek;
  if (hoursChanged) await refreshLedgerSafely(orgId);

  return memberById(member._id);
}
