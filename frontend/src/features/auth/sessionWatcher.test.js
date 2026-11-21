// @vitest-environment jsdom
// sessionWatcher.test.js
// What the app does when the auth client reports a change by itself
// (sessionWatcher.js): a background token refresh of a sign-in more than 7
// days old ends the session; a younger one is left alone; a sign-out from
// elsewhere forgets the user and when they signed in.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sessionWatcher } from './sessionWatcher.js';
import { recordSignIn, forgetSignIn } from '../../lib/auth/sessionAge.js';

const DAY = 24 * 60 * 60 * 1000;
let report;
const client = {
  signOut: vi.fn(async () => {}),
  onChange: (callback) => {
    report = callback;
    return () => {};
  },
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  forgetSignIn();
});
afterEach(() => vi.useRealTimers());

describe('watching the session', () => {
  it('ends a sign-in more than 7 days old when its token is refreshed', () => {
    recordSignIn(Date.now() - 8 * DAY);
    sessionWatcher(client, { clearUser: vi.fn() });
    report('TOKEN_REFRESHED');
    vi.runAllTimers();
    expect(client.signOut).toHaveBeenCalledTimes(1);
  });

  it('leaves a younger sign-in alone', () => {
    recordSignIn(Date.now() - 2 * DAY);
    sessionWatcher(client, { clearUser: vi.fn() });
    report('TOKEN_REFRESHED');
    vi.runAllTimers();
    expect(client.signOut).not.toHaveBeenCalled();
  });

  it('forgets the user, and when they signed in, when signed out elsewhere', () => {
    recordSignIn(Date.now());
    const clearUser = vi.fn();
    sessionWatcher(client, { clearUser });
    report('SIGNED_OUT');
    expect(clearUser).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('relay-signed-in-at')).toBeNull();
  });
});
