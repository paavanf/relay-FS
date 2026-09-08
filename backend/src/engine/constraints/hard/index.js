// index.js
// The registry of hard constraints. These must never be violated: any one of
// them firing makes a roster illegal.
//
// The evaluator runs whatever is in this array without knowing the names, so
// adding a constraint means adding one file and one line here.

import { checkQualificationMatch } from './qualificationMatch.js';
import { checkDeclaredUnavailability } from './declaredUnavailability.js';
import { checkNoDoubleBooking } from './noDoubleBooking.js';
import { checkMinimumRest } from './minimumRest.js';
import { checkMaxConsecutiveDays } from './maxConsecutiveDays.js';
import { checkMaxWeeklyHours } from './maxWeeklyHours.js';

export const HARD_CONSTRAINTS = [
  checkQualificationMatch,
  checkDeclaredUnavailability,
  checkNoDoubleBooking,
  checkMinimumRest,
  checkMaxConsecutiveDays,
  checkMaxWeeklyHours,
];

export {
  checkQualificationMatch,
  checkDeclaredUnavailability,
  checkNoDoubleBooking,
  checkMinimumRest,
  checkMaxConsecutiveDays,
  checkMaxWeeklyHours,
};
