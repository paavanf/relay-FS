// blockingRules.js
// Turns the engine's "who was blocked by which rule" tally into a sentence.
//
// Read from the fixture rather than written by hand, so the page can never
// claim a different reason than the engine actually gave.

const PLAIN_NAMES = {
  MAX_CONSECUTIVE_DAYS: 'the limit on days in a row',
  MIN_REST: 'minimum rest',
  MAX_WEEKLY_HOURS: 'weekly hours',
  DOUBLE_BOOKED: 'shifts people already had',
  DECLARED_UNAVAILABLE: 'declared unavailability',
  QUALIFICATION_MISMATCH: 'missing qualifications',
};

/** "Most were blocked by X, then by Y, then by Z." */
export function describeBlockingRules(blockedBy) {
  const names = Object.entries(blockedBy ?? {})
    .sort(([, a], [, b]) => b - a)
    .map(([code]) => PLAIN_NAMES[code] ?? code);

  if (names.length === 0) return '';
  if (names.length === 1) return `Every one was blocked by ${names[0]}.`;

  const [first, ...rest] = names;
  return `Most were blocked by ${first}, then by ${rest.join(', then by ')}.`;
}
