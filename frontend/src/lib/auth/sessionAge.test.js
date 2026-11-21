// @vitest-environment jsdom
// sessionAge.test.js
// Relay's own limit on a sign-in (lib/auth/sessionAge.js): 7 days from the
// moment of signing in, however active the session has been since. A
// session with no record of when it began counts as too old, and ending one
// signs out and leaves the login page a reason to give.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  recordSignIn,
  forgetSignIn,
  isSessionTooOld,
  endSessionForAge,
  sessionEndedForAge,
  SESSION_MAX_AGE_MS,
} from './sessionAge.js';

const DAY = 24 * 60 * 60 * 1000;
const SIGNED_IN = Date.UTC(2026, 9, 1, 9, 0);

beforeEach(() => {
  window.localStorage.clear();
  forgetSignIn();
});

describe('the 7-day limit on a sign-in', () => {
  it('lasts 7 days from signing in, and not a moment longer', () => {
    recordSignIn(SIGNED_IN);
    expect(isSessionTooOld(SIGNED_IN + 6 * DAY)).toBe(false);
    expect(isSessionTooOld(SIGNED_IN + SESSION_MAX_AGE_MS)).toBe(false);
    expect(isSessionTooOld(SIGNED_IN + SESSION_MAX_AGE_MS + 1)).toBe(true);
  });

  it('keeps the time beside the session, where every tab sees it', () => {
    recordSignIn(SIGNED_IN);
    expect(window.localStorage.getItem('relay-signed-in-at')).toBe(String(SIGNED_IN));
  });

  it('counts a session with no record of when it began as too old', () => {
    expect(isSessionTooOld(SIGNED_IN)).toBe(true);
  });

  it('ends a session by signing out, and remembers why until the next sign-in', async () => {
    recordSignIn(SIGNED_IN);
    const client = { signOut: vi.fn(async () => {}) };

    await endSessionForAge(client);
    expect(client.signOut).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('relay-signed-in-at')).toBeNull();
    expect(sessionEndedForAge()).toBe(true);

    recordSignIn(SIGNED_IN + 8 * DAY);
    expect(sessionEndedForAge()).toBe(false);
  });
});
