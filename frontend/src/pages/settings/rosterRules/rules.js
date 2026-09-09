// rules.js
// What the three scheduling rules are, and what counts as a sensible value.
//
// The bounds are kept here so the form and its validation cannot disagree,
// and they match the server's schema exactly - the client check is for a fast,
// clear message, never a substitute for the server's.

export const RULE_FIELDS = [
  {
    name: 'minRestHours',
    label: 'Minimum rest between shifts (hours)',
    helper: 'The shortest gap allowed between the end of one shift and the start of the next.',
    min: 0,
    max: 24,
  },
  {
    name: 'maxConsecutiveDays',
    label: 'Maximum consecutive working days',
    helper: 'How many days in a row someone may be scheduled before a day off is required.',
    min: 1,
    max: 14,
  },
  {
    name: 'maxHoursPerWeek',
    label: 'Maximum hours per week',
    helper: 'The most hours anyone may be scheduled in any rolling seven-day period.',
    min: 1,
    max: 80,
  },
];

/** An error message per field, or an empty object when everything is fine. */
export function validateRules(values) {
  const errors = {};

  for (const field of RULE_FIELDS) {
    const value = values[field.name];

    if (!Number.isInteger(value)) {
      errors[field.name] = 'Enter a whole number.';
    } else if (value < field.min || value > field.max) {
      errors[field.name] = `Must be between ${field.min} and ${field.max}.`;
    }
  }

  return errors;
}

export function rulesHaveChanged(values, saved) {
  if (!saved) return false;
  return RULE_FIELDS.some((field) => values[field.name] !== saved[field.name]);
}
