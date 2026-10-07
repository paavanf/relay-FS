// landingEditExample.js
// Finds the hand-edit example shown on the landing page, for
// export-landing-fixture.js. Every verdict is a real canAssign() answer;
// nothing here touches a database, the network or the clock.

import { canAssign, shiftInstants } from '../src/engine/index.js';
import { contextOf } from './landingFixtureParts.js';

function verdictFor(scenario, assignments, membershipId, template, date) {
  const times = shiftInstants(template, date, scenario.timezone);
  const candidate = { id: 'demo-candidate', membershipId, shiftTemplateId: template.id, date, ...times };
  const { allowed, violations } = canAssign(candidate, assignments, contextOf(scenario));

  return {
    allowed,
    violations: violations.map(({ code, severity, message, assignmentIds, details }) => ({
      code, severity, message, assignmentIds, details,
    })),
  };
}

/**
 * Finds a teaching example in the generated roster: someone who worked an
 * evening, is off the next day, and would break minimum rest by taking that
 * day's early shift - while the evening shift that day would be fine.
 */
export function findEditExample(scenario, assignments) {
  const [early, late] = scenario.shiftTemplates;
  const byKey = new Map(assignments.map((a) => [`${a.membershipId}|${a.date}`, a]));
  let fallback = null;

  for (const { membershipId } of scenario.workers) {
    for (const previous of assignments.filter((a) => a.membershipId === membershipId)) {
      if (previous.shiftTemplateId !== late.id) continue;
      const date = new Date(Date.parse(previous.date) + 86_400_000).toISOString().slice(0, 10);
      if (date > scenario.endDate || byKey.has(`${membershipId}|${date}`)) continue;

      const choices = [early, late].map((t) => ({
        templateId: t.id,
        verdict: verdictFor(scenario, assignments, membershipId, t, date),
      }));
      const example = { membershipId, date, previous, choices };

      const earlyBlockedByRest = choices[0].verdict.violations.some((v) => v.code === 'MIN_REST');
      if (earlyBlockedByRest && choices[1].verdict.allowed) return example;
      if (earlyBlockedByRest && !fallback) fallback = example;
    }
  }

  return fallback;
}
