// Date formatting helpers. All built on Luxon so the whole app formats dates
// the same way. Each function accepts an ISO string or a JS Date.

import { DateTime } from 'luxon';

// Turns whatever we were given into a Luxon DateTime.
function toDateTime(value) {
  if (value instanceof Date) return DateTime.fromJSDate(value);
  return DateTime.fromISO(value);
}

// "12 Mar 2026"
export function formatDate(value) {
  const dt = toDateTime(value);
  if (!dt.isValid) return '';
  return dt.toFormat('d LLL yyyy');
}

// "09:30"
export function formatTime(value) {
  const dt = toDateTime(value);
  if (!dt.isValid) return '';
  return dt.toFormat('HH:mm');
}

// "3 hours ago" / "in 2 days"
export function formatRelative(value) {
  const dt = toDateTime(value);
  if (!dt.isValid) return '';
  return dt.toRelative();
}
