// listMembers.service.js
// Lists the active members of an organisation. Deactivated members are kept
// for history but are not part of the team any more, so they are not listed.

import { Membership, User } from '../../models/index.js';
import { MEMBERSHIP_STATUS } from '../../config/constants.js';
import { toMemberDto } from './memberDto.js';

export async function listMembers(orgId) {
  const memberships = await Membership.find({ orgId, status: MEMBERSHIP_STATUS.ACTIVE }).lean();

  // One query for every user involved, rather than one per membership.
  const users = await User.find({ _id: { $in: memberships.map((m) => m.userId) } })
    .select('name email')
    .lean();
  const userOf = new Map(users.map((u) => [String(u._id), u]));

  return memberships.map((m) => toMemberDto(m, userOf.get(String(m.userId))));
}
