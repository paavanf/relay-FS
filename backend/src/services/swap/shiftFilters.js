// shiftFilters.js
// What an offer says its owner would take in return, in one tidy shape:
// { categories, daysOfWeek }, each sorted and listed once, empty for any. The
// same shape is stored, returned by the API, and handed to the engine.

export function filtersOf(stored) {
  return {
    categories: [...new Set(stored?.categories ?? [])].sort(),
    daysOfWeek: [...new Set(stored?.daysOfWeek ?? [])].sort((a, b) => a - b),
  };
}
