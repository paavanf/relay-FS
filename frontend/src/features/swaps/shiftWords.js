// shiftWords.js
// How a shift is named wherever swaps are described, so the sentences, the
// diagram and the lists all say the same thing about it:
//
//   shiftPhrase  "night shift on Thursday 19 March"  inside a sentence
//   shiftTag     "Thu 19 Night"                      on a diagram arrow
//   shiftTitle   "Thursday 19 March, Night"          in a list
//
// Every function takes the shift as the swap API returns it:
// { date, startsAt, endsAt, shift: { name, category } }.

import { DateTime } from 'luxon';

function day(assignment, format) {
  const dt = DateTime.fromISO(assignment.date, { zone: 'utc' });
  return dt.isValid ? dt.toFormat(format) : assignment.date;
}

const nameOf = (assignment) => assignment.shift?.name ?? 'Shift';

// "Night" -> "night shift"; a template already called "Night shift" is not doubled.
const asShift = (name) => `${name.toLowerCase().replace(/\s+shift$/, '')} shift`;

export const shiftPhrase = (assignment) => `${asShift(nameOf(assignment))} on ${day(assignment, 'cccc d LLLL')}`;

export const shiftTag = (assignment) => `${day(assignment, 'ccc d')} ${nameOf(assignment)}`;

export const shiftTitle = (assignment) => `${day(assignment, 'cccc d LLLL')}, ${nameOf(assignment)}`;
