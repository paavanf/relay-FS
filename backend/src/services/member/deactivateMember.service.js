// deactivateMember.service.js
// Takes someone out of the organisation without erasing them.
//
// Never a hard delete: their past shifts belong to rosters people relied on,
// so the membership is set inactive and every record stays readable. From then
// on they are left out of generation and fairness, the Team page no longer
// lists them, and resolveMembership shuts them out of this organisation.
// The steps themselves - draft shifts, the last-owner rule, the ledger - are
// in deactivateMembership.js, which a deleted sign-in uses too.
//
// Who may: a manager can deactivate members; deactivating a manager or an
// owner takes an owner. The last active owner can never be deactivated.

import { Membership } from '../../models/index.js';
import { MEMBERSHIP_STATUS, ROLES } from '../../config/constants.js';
import { AppError } from '../../errors/AppError.js';
import { deactivateMembership } from './deactivateMembership.js';
import { memberById } from './memberDto.js';

export async function deactivateMember({ orgId, actor, membershipId }) {
  const member = await Membership.findOne({ _id: membershipId, orgId, status: MEMBERSHIP_STATUS.ACTIVE }).lean();
  if (!member) throw AppError.notFound('Member not found');

  if (member.role !== ROLES.MEMBER && actor.role !== ROLES.OWNER) {
    throw AppError.forbidden('Only an owner can deactivate a manager or an owner.');
  }

  const removedDraftShifts = await deactivateMembership(member);
  return { member: await memberById(member._id), removedDraftShifts };
}
