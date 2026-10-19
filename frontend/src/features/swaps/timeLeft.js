// timeLeft.js
// How long a proposed swap has left, in words, from its expiresAt:
//
//   "2 days, 3 hours left"   "5 hours, 12 minutes left"   "40 minutes left"
//   "Less than a minute left"                   null once the time is up
//
// Derived every time from the stored deadline and the clock, never counted
// down in memory: when it reaches nothing, the page asks the server what
// happened rather than assuming.

const unit = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function timeLeft(expiresAt, now = Date.now()) {
  const ms = new Date(expiresAt).getTime() - now;
  if (!(ms > 0)) return null;

  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'Less than a minute left';

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  if (days > 0) return `${unit(days, 'day')}${hours ? `, ${unit(hours, 'hour')}` : ''} left`;
  if (hours > 0) return `${unit(hours, 'hour')}${rest ? `, ${unit(rest, 'minute')}` : ''} left`;
  return `${unit(rest, 'minute')} left`;
}

/** Milliseconds until the deadline - never negative. */
export const msUntil = (expiresAt, now = Date.now()) => Math.max(0, new Date(expiresAt).getTime() - now);
