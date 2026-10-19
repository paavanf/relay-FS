// swapRuleFields.js
// The organisation's swap rules, and what counts as a sensible value - the
// same bounds as the server's schema, so the form gives a fast, clear
// message, never a substitute for the server's own check.
//
//   acceptanceWindowHours   1 to 168 (a week)
//   requireManagerApproval  yes or no
//   maxChainLength          2 to 4 people

export const WINDOW_RANGE = { min: 1, max: 168 };
export const CHAIN_LENGTHS = [2, 3, 4];

/** An error message per field, or an empty object when everything is fine. */
export function validateSwapRules(values) {
  const errors = {};
  const hours = values.acceptanceWindowHours;

  if (!Number.isInteger(hours)) errors.acceptanceWindowHours = 'Enter a whole number of hours.';
  else if (hours < WINDOW_RANGE.min || hours > WINDOW_RANGE.max) {
    errors.acceptanceWindowHours = `Must be between ${WINDOW_RANGE.min} and ${WINDOW_RANGE.max} hours.`;
  }
  if (typeof values.requireManagerApproval !== 'boolean') errors.requireManagerApproval = 'Choose whether a manager approves swaps.';
  if (!CHAIN_LENGTHS.includes(values.maxChainLength)) errors.maxChainLength = 'Choose 2, 3 or 4 people.';

  return errors;
}

export function swapRulesChanged(values, saved) {
  if (!saved) return false;
  return ['acceptanceWindowHours', 'requireManagerApproval', 'maxChainLength'].some((name) => values[name] !== saved[name]);
}
