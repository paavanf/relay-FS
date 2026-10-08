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
import { MIN_COMPARED_TEAM } from '../../config/fairness.js';

// Org-wide fields only. -_id: not even another row's document id comes back.
const SHARED_FIELDS = 'windowStart windowEnd teamAverage computedAt -_id';

export async function getFairness({ orgId, membership }) {
  return isManagerRole(membership.role) ? teamView(orgId) : selfView(orgId, membership._id);
}

// In a team too small to compare safely (see MIN_COMPARED_TEAM), the average
// and the worker's deviation from it are left out of the response entirely.
async function selfView(orgId, membershipId) {
  const [meta, own, measured] = await Promise.all([
    FairnessLedger.findOne({ orgId }).select(SHARED_FIELDS).lean(),
    FairnessLedger.findOne({ orgId, membershipId }).lean(),
    FairnessLedger.countDocuments({ orgId, measured: true }),
  ]);

  const comparable = measured >= MIN_COMPARED_TEAM;
  const { window, computedAt, policy, teamAverage } = sharedFigures(meta);
  const figures = own ? personalFigures(own) : null;

  return {
    view: 'self',
    window,
    computedAt,
    policy,
    comparison: { available: comparable, minimumMeasured: MIN_COMPARED_TEAM },
    ...(comparable ? { teamAverage } : {}),
    you: figures && !comparable ? withoutDeviation(figures) : figures,
  };
}

function withoutDeviation(figures) {
  return Object.fromEntries(Object.entries(figures).filter(([key]) => key !== 'deviationPercent'));
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
