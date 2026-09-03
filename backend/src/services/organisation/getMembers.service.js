// getMembers.service.js
// Lists all active members of an organisation.

import { Membership, User } from '../../models/index.js';
import { MEMBERSHIP_STATUS } from '../../config/constants.js';

export async function getOrgMembers(orgId) {
  const memberships = await Membership.find({
    orgId,
    status: MEMBERSHIP_STATUS.ACTIVE,
  }).lean();

  // One query for every user involved, rather than one per membership.
  const userIds = memberships.map((m) => m.userId);
  const users = await User.find({ _id: { $in: userIds } })
    .select('name email')
    .lean();

  const userMap = {};
  users.forEach((u) => {
    userMap[u._id.toString()] = u;
  });

  return memberships.map((m) => {
    const u = userMap[m.userId.toString()];
    return {
      id: m._id.toString(),
      userId: m.userId.toString(),
      name: u?.name || 'Unknown',
      email: u?.email || '',
      role: m.role,
      qualificationIds: (m.qualificationIds ?? []).map((id) => id.toString()),
      employmentType: m.employmentType,
      contractedHoursPerWeek: m.contractedHoursPerWeek,
      joinedAt: m.joinedAt,
    };
  });
}
