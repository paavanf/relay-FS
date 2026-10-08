// inviterNames.js
// An invite records the MEMBERSHIP that sent it, so the person's name is two
// hops away. Looked up in bulk so a list of invites costs two queries, not two
// per invite.

import { Membership, User } from '../../models/index.js';

/** Map of membershipId -> the sender's name ('' when they cannot be found). */
export async function inviterNames(membershipIds) {
  const ids = [...new Set(membershipIds.map(String))];
  if (ids.length === 0) return new Map();

  const memberships = await Membership.find({ _id: { $in: ids } }).select('userId').lean();
  const users = await User.find({ _id: { $in: memberships.map((m) => m.userId) } })
    .select('name')
    .lean();

  const nameOfUser = new Map(users.map((u) => [String(u._id), u.name]));
  return new Map(memberships.map((m) => [String(m._id), nameOfUser.get(String(m.userId)) ?? '']));
}
