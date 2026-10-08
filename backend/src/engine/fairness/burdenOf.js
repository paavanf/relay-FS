// burdenOf.js
// How heavy one shift was, as a single number.
//
// The base is the shift template's burdenWeight. A manager already sets a night
// heavier than a day there, so nights are not multiplied again here. On top of
// that, a shift that STARTS on a Saturday or Sunday is multiplied by the
// policy's weekendMultiplier.
//
// "Starts" is decided in the organisation's timezone, from the real start
// instant. That matters for nights: Friday 23:00 to Saturday 07:00 is a Friday
// shift, and a shift starting 01:00 Saturday in Kolkata is a weekend shift even
// though it is still Friday in UTC.
//
// PURE: the policy and the timezone are passed in.

import { localDayOfWeek } from '../time.js';
import { positiveOr } from './numbers.js';

// Day numbers as localDayOfWeek() returns them: Sunday is 0.
const SUNDAY = 0;
const SATURDAY = 6;

/** True when the shift starts on a Saturday or Sunday in the given timezone. */
export function isWeekendShift(startsAt, timezone) {
  const day = localDayOfWeek(startsAt, timezone);
  return day === SATURDAY || day === SUNDAY;
}

/**
 * @param {{ startsAt: string }} assignment
 * @param {{ burdenWeight?: number } | undefined} template  undefined counts as 1
 * @param {{ weekendMultiplier?: number }} policy
 * @param {string} timezone  IANA zone of the organisation
 */
export function burdenOf(assignment, template, policy, timezone) {
  const base = positiveOr(template?.burdenWeight, 1);
  if (!isWeekendShift(assignment.startsAt, timezone)) return base;

  return base * positiveOr(policy?.weekendMultiplier, 1);
}
