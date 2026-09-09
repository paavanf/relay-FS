// toStatusByDay.js
// Saved availability entries -> one status per weekday, for the selects.
//
// "Available" is the absence of an entry rather than a value, so any weekday
// missing from the result is simply free.

export function toStatusByDay(entries) {
  const byDay = {};

  for (const entry of entries) {
    if (entry.type === 'recurring' && entry.dayOfWeek !== null) {
      byDay[entry.dayOfWeek] = entry.status;
    }
  }

  return byDay;
}
