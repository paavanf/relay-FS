// signInAge.test.js
// Relay's 7-day limit on a sign-in, as the API keeps it
// (services/identity/signInAge.js), read from a token's amr claim - the
// times Supabase stamps on each way a session was authenticated:
//   - signed in 6 days ago: accepted; 8 days ago: 401 SESSION_EXPIRED
//   - the limit is the shared one (shared/sessionLimits.js): exactly 7 days
//     still passes, a second more does not
//   - the earliest entry is the sign-in; a token_refresh entry never counts
//   - a token that does not say when it signed in is refused

import { describe, it, expect } from 'vitest';
import { signedInAt, assertRecentSignIn } from '../../src/services/identity/signInAge.js';
import { SESSION_MAX_AGE_MS } from '../../../shared/sessionLimits.js';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 30, 12, 0);
const amr = (...entries) => ({ amr: entries.map(([method, ago]) => ({ method, timestamp: Math.floor((NOW - ago) / 1000) })) });

function outcome(claims) {
  try {
    assertRecentSignIn(claims, NOW);
    return 'accepted';
  } catch (error) {
    return { status: error.statusCode, code: error.code };
  }
}

describe("a token's sign-in age", () => {
  it('accepts a sign-in 6 days old, and refuses one 8 days old as expired', () => {
    expect(outcome(amr(['password', 6 * DAY]))).toBe('accepted');
    expect(outcome(amr(['password', 8 * DAY]))).toEqual({ status: 401, code: 'SESSION_EXPIRED' });
  });

  it('keeps the shared limit: exactly 7 days old passes, a second more does not', () => {
    expect(SESSION_MAX_AGE_MS).toBe(7 * DAY);
    expect(outcome(amr(['oauth', SESSION_MAX_AGE_MS]))).toBe('accepted');
    expect(outcome(amr(['oauth', SESSION_MAX_AGE_MS + 1000]))).toEqual({ status: 401, code: 'SESSION_EXPIRED' });
  });

  it('measures from the earliest entry, and never from a token_refresh', () => {
    expect(signedInAt(amr(['totp', DAY], ['password', 3 * DAY]))).toBe(NOW - 3 * DAY);
    expect(outcome(amr(['totp', DAY], ['password', 8 * DAY]))).toEqual({ status: 401, code: 'SESSION_EXPIRED' });
    expect(outcome(amr(['token_refresh', 0], ['password', 8 * DAY]))).toEqual({ status: 401, code: 'SESSION_EXPIRED' });
  });

  it('refuses a token that does not say when it signed in', () => {
    for (const claims of [{}, { amr: [] }, amr(['token_refresh', 0]), { amr: [{ method: 'password' }] }]) {
      expect(outcome(claims)).toEqual({ status: 401, code: 'UNAUTHORIZED' });
    }
  });
});
