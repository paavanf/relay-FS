// memberDto.js
// One member as the API returns them: the membership, plus the person's name
// and email. Shared by the list and by every endpoint that changes a member,
// so the Team page gets the same shape back whatever it just did.

import { Membership, User } from '../../models/index.js';

export function toMemberDto(membership, user) {
  return {
    id: String(membership._id),
    userId: String(membership.userId),
    name: user?.name || 'Unknown',
    email: user?.email || '',
    role: membership.role,
    status: membership.status,
    qualificationIds: (membership.qualificationIds ?? []).map(String),
    employmentType: membership.employmentType,
    contractedHoursPerWeek: membership.contractedHoursPerWeek,
    joinedAt: membership.joinedAt,
  };
}

export async function memberById(membershipId) {
  const membership = await Membership.findById(membershipId).lean();
  const user = await User.findById(membership.userId).select('name email').lean();
  return toMemberDto(membership, user);
}
