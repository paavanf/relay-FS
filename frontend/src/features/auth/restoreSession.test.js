// @vitest-environment jsdom
// restoreSession.test.js
// As the app loads (restoreSession.js), a stored sign-in more than 7 days
// old is ended - signed out, never restored - while a younger one carries
// on. A sign-in arriving from an emailed link or Google counts as signing in
// now, whatever an older record says. The auth client is a stand-in.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const client = { signOut: vi.fn(async () => {}), accessToken: vi.fn(async () => 'token'), adoptSession: vi.fn(async () => {}) };
const arrived = { value: null };

vi.mock('../../lib/auth/authClient.js', () => ({ authClient: async () => client }));
vi.mock('../../lib/auth/authRedirect.js', () => ({ authRedirect: () => arrived.value }));
vi.mock('../../lib/auth/storedSession.js', () => ({ hasStoredSession: () => true }));

const DAY = 24 * 60 * 60 * 1000;

// restoreSession runs once per page load, so each test loads it afresh.
async function loadApp({ signedInDaysAgo }) {
  vi.resetModules();
  const age = await import('../../lib/auth/sessionAge.js');
  age.forgetSignIn();
  if (signedInDaysAgo !== undefined) age.recordSignIn(Date.now() - signedInDaysAgo * DAY);
  const { restoreSession } = await import('./restoreSession.js');
  return { result: await restoreSession(), age };
}

beforeEach(() => {
  vi.clearAllMocks();
  arrived.value = null;
});

describe('restoring a session as the app loads', () => {
  it('ends a sign-in more than 7 days old instead of restoring it', async () => {
    const { result, age } = await loadApp({ signedInDaysAgo: 8 });
    expect(result.signedIn).toBe(false);
    expect(client.signOut).toHaveBeenCalledTimes(1);
    expect(age.sessionEndedForAge()).toBe(true);
  });

  it('ends one with no record of when it began', async () => {
    expect((await loadApp({})).result.signedIn).toBe(false);
    expect(client.signOut).toHaveBeenCalledTimes(1);
  });

  it('restores a younger sign-in', async () => {
    expect((await loadApp({ signedInDaysAgo: 6 })).result.signedIn).toBe(true);
    expect(client.signOut).not.toHaveBeenCalled();
  });

  it('counts a sign-in arriving in the address as signing in now', async () => {
    arrived.value = { accessToken: 'a', refreshToken: 'r', type: 'signup' };
    const { result, age } = await loadApp({ signedInDaysAgo: 30 });
    expect(result.signedIn).toBe(true);
    expect(client.adoptSession).toHaveBeenCalledTimes(1);
    expect(age.isSessionTooOld()).toBe(false);
  });
});
