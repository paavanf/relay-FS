// lockoutWait.js
// Reads the wait out of a 429 message so the form can hold the submit button
// disabled for exactly that long.
//
// The backend phrases the account lockout as "Try again in 3 minutes" (or
// "in a minute" when under two). A 429 from the IP rate limiter carries no
// time at all, which is why zero is a valid answer: show the message, but
// don't pretend to know when it lifts.

export function parseLockoutSeconds(message = '') {
  if (/in a minute/i.test(message)) return 60;

  const match = message.match(/in (\d+)\s*minutes?/i);
  return match ? Number(match[1]) * 60 : 0;
}

// 125 -> "2:05", 45 -> "45s". Minutes and seconds read better than a bare
// count once the wait is over a minute.
export function formatWait(seconds) {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${remainder}`;
}
