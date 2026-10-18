// memberNames.js
// Membership ids to people's names, in two queries however many are asked
// for. Used wherever a response names some people and must name nobody else:
// a swap chain names the people in it, never the rest of the team.

import { Membership, User } from '../../models/index.js';

/** @returns {Promise<Map<string, string>>} membershipId -> name */
export async function namesOf(membershipIds) {
  const ids = [...new Set(membershipIds.map(String))];
  if (ids.length === 0) return new Map();

  const memberships = await Membership.find({ _id: { $in: ids } }).select('userId').lean();
  const users = await User.find({ _id: { $in: memberships.map((m) => m.userId) } })
    .select('name')
    .lean();
  const nameOfUser = new Map(users.map((u) => [String(u._id), u.name]));

  return new Map(memberships.map((m) => [String(m._id), nameOfUser.get(String(m.userId)) ?? 'A team member']));
}
