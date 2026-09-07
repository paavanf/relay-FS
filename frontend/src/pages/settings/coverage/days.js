// days.js
// Weekday names, indexed the way the API expects: 0 = Sunday, matching
// JavaScript's Date.getDay(). Shared by the coverage and availability views
// so the two never disagree about which number means which day.

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function dayName(dayOfWeek) {
  return DAY_NAMES[dayOfWeek] ?? 'Unknown';
}
