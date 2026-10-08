// wardRules.js
// What the demo ward's shifts need, and what its people have said about when
// they can work. Plain data again; writeWard.js stores it.
//
// Coverage runs every day of the week, because a ward never closes:
//   Day      a charge nurse, a registered nurse and a healthcare assistant
//   Evening  a registered nurse, plus a healthcare assistant on weekdays
//   Night    a registered nurse and a healthcare assistant
// That is 28 nursing shifts and 19 assistant shifts a week, against 250 and
// 165 contracted hours (31 and 20 shifts of 8 hours).

const WEEKDAYS = [1, 2, 3, 4, 5];

/** The requirements for one shift on one day (0 = Sunday), by qualification key. */
export function needsFor(templateKey, dayOfWeek) {
  if (templateKey === 'day') return [['cn', 1], ['rn', 1], ['hca', 1]];
  if (templateKey === 'evening') return WEEKDAYS.includes(dayOfWeek) ? [['rn', 1], ['hca', 1]] : [['rn', 1]];
  return [['rn', 1], ['hca', 1]];
}

// Recurring entries repeat every week on the listed days. Exceptions name
// single dates, as days counted from the Monday of the current week, so they
// always land in the history or the draft whenever the seed is run.
//
// All three kinds appear: unavailable is a hard rule the generator obeys,
// prefer and avoid are wishes it weighs.
export const AVAILABILITY = [
  { person: 'grace', days: [4, 5, 6, 0], status: 'unavailable', note: 'Works Monday to Wednesday only.' },
  { person: 'leo', days: [1, 2, 6, 0], status: 'unavailable', note: 'At college; free Wednesday to Friday.' },
  { person: 'kavya', days: [0], status: 'unavailable', note: 'Sundays off.' },
  { person: 'kavya', days: [5, 6], shift: 'night', status: 'avoid', note: 'Would rather not do weekend nights.' },
  { person: 'dara', days: [0], status: 'avoid', note: 'Family day, but can cover if needed.' },
  { person: 'asha', days: [1, 2, 3], shift: 'day', status: 'prefer', note: 'Likes leading the early week.' },
  { person: 'femi', days: [1, 2], shift: 'night', status: 'prefer', note: 'Prefers nights early in the week.' },
  { person: 'hiro', days: [6, 0], shift: 'night', status: 'prefer', note: 'Happy to take weekend nights.' },

  { person: 'bilal', offsets: [-12], status: 'unavailable', note: 'Study day.' },
  { person: 'isla', offsets: [4], shift: 'evening', status: 'avoid', note: "Daughter's school play." },
  { person: 'elif', offsets: [9, 10, 11], status: 'unavailable', note: 'Annual leave.' },
  { person: 'jonas', offsets: [16, 17], status: 'unavailable', note: "Brother's wedding." },
];
