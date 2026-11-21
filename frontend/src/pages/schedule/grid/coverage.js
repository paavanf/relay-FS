// coverage.js
// The coverage row's numbers: per day, how many places the coverage rules
// ask for, how many are filled, and which roles are short - so "5/6" can say
// that the missing one is the charge nurse.
//
// Required is what the rules ask for that weekday, the same demand the
// generator expands into slots; filled is every shift on the day. A place
// counts as filled only by someone rostered into that role.
//
// Shifts saved before Relay recorded roles fill no particular place, so a day
// with one is judged by its headcount alone, as every day was before roles -
// rather than claiming a role is missing when nobody can tell.

import { placesFor } from '../roles.js';

const idOf = (template) => String(template._id ?? template.id);

/** { filled, required, short: [{ shift, role, missing }], unrecorded } for one date. */
export function coverageOn(date, { coverage, templates, qualificationsById, assignments }) {
  const onDay = assignments.filter((a) => a.date === date);
  const unrecorded = onDay.filter((a) => !a.slotQualificationId && placesFor(coverage, a.shiftTemplateId, date).length > 0).length;
  const short = [];
  let required = 0;

  for (const template of templates) {
    for (const place of placesFor(coverage, idOf(template), date)) {
      required += place.required;
      const filled = onDay.filter((a) => String(a.shiftTemplateId) === idOf(template) && a.slotQualificationId === place.qualificationId).length;
      if (unrecorded === 0 && filled < place.required) {
        short.push({ shift: template.name, role: qualificationsById.get(place.qualificationId)?.name ?? 'a role', missing: place.required - filled });
      }
    }
  }
  return { filled: onDay.length, required, short, unrecorded };
}

/**
 * 'covered', 'thin' (three quarters or more of the places) or 'short' - the
 * rule the coverage row has always coloured by, kept here so the Schedule
 * summary strip says exactly the same thing. 'none' when no coverage rule
 * asks for anyone that day: with nothing to cover, nothing is claimed.
 */
export function coverageStatus({ filled, required, short }) {
  if (required === 0) return 'none';
  if (short.length === 0 && filled >= required) return 'covered';
  return filled / required >= 0.75 ? 'thin' : 'short';
}

/** The coverage cell's full sentence, for its tooltip and for screen readers. */
export function describeCoverage({ filled, required, short, unrecorded }) {
  if (required === 0) return `${filled} shifts, and no coverage rule for this day.`;
  const counted = `${filled} of ${required} places filled.`;
  if (unrecorded > 0) {
    const saved = unrecorded === 1 ? 'One shift was' : `${unrecorded} shifts were`;
    return `${counted} ${saved} saved before Relay recorded roles, so this day is counted by headcount only.`;
  }
  const missing = short.map((s) => `${s.missing} ${s.role} on ${s.shift}`).join(', ');
  return `${counted}${missing ? ` Missing: ${missing}.` : ''}`;
}
