// getFairness.service.js
// The stored fairness ledger, shaped for whoever is asking.
//
// PRIVACY IS ENFORCED HERE, NOT IN THE UI. An owner or manager sees every
// member's row, with names. A worker gets their own figures, the team average
// and the window - nothing else. No other member's id, name or figures is ever
// read into a worker's response, so no client, however it is written, can show
// what it never received.
//
// Why so strict: a named table of who works the most nights would create the
// very friction this feature exists to remove. Against the average, a worker
// can see whether THEY are treated fairly without anyone being ranked.

import { FairnessLedger, Membership, User } from '../../models/index.js';
import { MEMBERSHIP_STATUS } from '../../config/constants.js';
import { isManagerRole } from '../../utils/roles.js';
import { sharedFigures, personalFigures } from './fairnessView.js';

// Org-wide fields only. -_id: not even another row's document id comes back.
const SHARED_FIELDS = 'windowStart windowEnd teamAverage computedAt -_id';

export async function getFairness({ orgId, membership }) {
  return isManagerRole(membership.role) ? teamView(orgId) : selfView(orgId, membership._id);
}

async function selfView(orgId, membershipId) {
  const [meta, own] = await Promise.all([
    FairnessLedger.findOne({ orgId }).select(SHARED_FIELDS).lean(),
    FairnessLedger.findOne({ orgId, membershipId }).lean(),
  ]);

  return { view: 'self', ...sharedFigures(meta), you: own ? personalFigures(own) : null };
}

async function teamView(orgId) {
  const [rows, memberships] = await Promise.all([
    FairnessLedger.find({ orgId }).lean(),
    Membership.find({ orgId, status: MEMBERSHIP_STATUS.ACTIVE }).select('userId').lean(),
  ]);

  const users = await User.find({ _id: { $in: memberships.map((m) => m.userId) } })
    .select('name')
    .lean();
  const nameOfUser = new Map(users.map((u) => [String(u._id), u.name]));
  const nameOf = new Map(
    memberships.map((m) => [String(m._id), nameOfUser.get(String(m.userId)) ?? 'Unknown member']),
  );

  return {
    view: 'team',
    ...sharedFigures(rows[0]),
    // Someone who has left since the last recompute is not shown.
    rows: rows
      .filter((row) => nameOf.has(String(row.membershipId)))
      .map((row) => ({
        membershipId: String(row.membershipId),
        name: nameOf.get(String(row.membershipId)),
        contractedHoursPerWeek: row.contractedHoursPerWeek ?? 0,
        ...personalFigures(row),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}
