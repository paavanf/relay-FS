// patternContinuity.js
// People overwhelmingly prefer a run of the same kind of shift to alternating
// between them. Three nights in a row is tiring; night, day, night is worse,
// because the body never gets to settle.
//
// So this penalises changing shift category between consecutive working days.
// Non-consecutive days are not penalised - there was a day off in between to
// adjust, which is exactly the point.
//
// This is a preference, not a rule: it scores, it never blocks.

import { byMembership, indexBy } from '../../grouping.js';
import { localDate, daysBetween } from '../../time.js';

const CATEGORY_SWITCH_PENALTY = 3;

/**
 * @param {import('../../types.js').EngineAssignment[]} assignments
 * @param {import('../../types.js').EngineContext} context
 * @returns {import('../../types.js').SoftPenalty[]}
 */
export function scorePatternContinuity(assignments, context) {
  const templates = indexBy(context.shiftTemplates, 'id');
  const penalties = [];

  for (const [membershipId, own] of byMembership(assignments)) {
    // One entry per working day. Where someone has two shifts on one day, the
    // earliest sets that day's character.
    const days = new Map();

    for (const assignment of own) {
      const day = localDate(assignment.startsAt, context.timezone);
      const category = templates.get(assignment.shiftTemplateId)?.category;
      if (!day || !category) continue;

      const existing = days.get(day);
      if (!existing || assignment.startsAt < existing.startsAt) {
        days.set(day, { category, startsAt: assignment.startsAt, id: assignment.id });
      }
    }

    const ordered = [...days.entries()].sort(([a], [b]) => a.localeCompare(b));

    for (let i = 0; i + 1 < ordered.length; i += 1) {
      const [day, current] = ordered[i];
      const [nextDay, next] = ordered[i + 1];

      if (daysBetween(day, nextDay) !== 1) continue;
      if (current.category === next.category) continue;

      penalties.push({
        code: 'CATEGORY_SWITCH',
        membershipId,
        assignmentIds: [current.id, next.id],
        penalty: CATEGORY_SWITCH_PENALTY,
        message: `Switches from ${current.category} to ${next.category} on consecutive days.`,
      });
    }
  }

  return penalties;
}
