// waitWords.js
// How long until someone may try again, as people say it: "in a minute",
// "in 12 minutes", "in about 3 hours". Always rounded up, so nobody is told
// to come back before the limit has actually lifted.

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export function waitWords(ms) {
  const minutes = Math.ceil(Math.max(ms, 0) / MINUTE);
  if (minutes <= 1) return 'in a minute';
  if (minutes < 60) return `in ${minutes} minutes`;
  const hours = Math.ceil(ms / HOUR);
  return hours === 1 ? 'in about an hour' : `in about ${hours} hours`;
}
