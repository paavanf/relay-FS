// loadLedgerInput.service.js
// Everything computeLedger() needs for one organisation and one window, loaded
// and flattened into the plain objects the engine expects.
//
// Only PUBLISHED rosters count. A draft is a proposal, not work someone
// carried, so a manager trying out a roster never moves anyone's numbers.
//
// Shift templates are loaded by id, retired ones included. A template retired
// last month still says how heavy the nights worked on it were - loading only
// the active ones would quietly count those nights as plain days.
//
// The window is trimmed to start no earlier than the first published roster
// in it: weeks before anything was rostered are not weeks anyone was "under".

import { Roster, Assignment, ShiftTemplate, Membership } from '../../models/index.js';
import { MEMBERSHIP_STATUS } from '../../config/constants.js';
import { DEFAULT_FAIRNESS_POLICY } from '../../config/fairness.js';
import { clampWindowStart } from '../../engine/index.js';

export async function loadLedgerInput({ org, window: requested }) {
  const orgId = org._id;

  const rosters = await Roster.find({
    orgId,
    status: 'published',
    startDate: { $lte: requested.endDate },
    endDate: { $gte: requested.startDate },
  })
    .select('_id startDate')
    .lean();

  const earliest = rosters.reduce((min, r) => (min === null || r.startDate < min ? r.startDate : min), null);
  const window = clampWindowStart(requested, earliest);

  const [assignments, memberships] = await Promise.all([
    rosters.length === 0
      ? []
      : Assignment.find({
          orgId,
          rosterId: { $in: rosters.map((r) => r._id) },
          date: { $gte: window.startDate, $lte: window.endDate },
        }).lean(),
    Membership.find({ orgId, status: MEMBERSHIP_STATUS.ACTIVE })
      .select('contractedHoursPerWeek joinedAt createdAt')
      .lean(),
  ]);

  const templateIds = [...new Set(assignments.map((a) => String(a.shiftTemplateId)))];
  const templates =
    templateIds.length === 0
      ? []
      : await ShiftTemplate.find({ orgId, _id: { $in: templateIds } })
          .select('category burdenWeight')
          .lean();

  return {
    timezone: org.timezone,
    window,
    policy: DEFAULT_FAIRNESS_POLICY,
    workers: memberships.map((m) => ({
      membershipId: String(m._id),
      contractedHoursPerWeek: m.contractedHoursPerWeek ?? 0,
      // Someone who joined mid-window is measured only from that day.
      joinedAt: (m.joinedAt ?? m.createdAt)?.toISOString(),
    })),
    shiftTemplates: templates.map((t) => ({
      id: String(t._id),
      category: t.category,
      burdenWeight: t.burdenWeight ?? 1,
    })),
    // The engine compares instants as ISO strings and ids as strings. The id
    // lets a swap's impact preview move shifts between people in this input.
    assignments: assignments.map((a) => ({
      id: String(a._id),
      membershipId: String(a.membershipId),
      shiftTemplateId: String(a.shiftTemplateId),
      startsAt: a.startsAt.toISOString(),
      endsAt: a.endsAt.toISOString(),
    })),
  };
}
