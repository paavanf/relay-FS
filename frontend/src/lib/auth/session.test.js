// session.test.js
// The token the API client sends comes from the auth client - but only when
// a session is stored, so public pages never load the sign-in code. However
// many requests need a refresh at once, the auth client is asked once - and
// a sign-in more than 7 days old is ended rather than refreshed.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authClient } from './authClient.js';
import { hasStoredSession } from './storedSession.js';
import { recordSignIn } from './sessionAge.js';
import { currentAccessToken, refreshAccessToken } from './session.js';

vi.mock('./authClient.js', () => ({ authClient: vi.fn() }));
vi.mock('./storedSession.js', () => ({ hasStoredSession: vi.fn() }));

const DAY = 24 * 60 * 60 * 1000;
const client = { accessToken: vi.fn(async () => 'token'), refresh: vi.fn(), signOut: vi.fn(async () => {}) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authClient).mockResolvedValue(client);
  recordSignIn(); // signed in just now
});

describe('the session the API client uses', () => {
  it('has no token, and loads nothing, when no session is stored', async () => {
    vi.mocked(hasStoredSession).mockReturnValue(false);
    expect(await currentAccessToken()).toBeNull();
    expect(authClient).not.toHaveBeenCalled();
  });

  it("reads the auth client's token when a session is stored", async () => {
    vi.mocked(hasStoredSession).mockReturnValue(true);
    expect(await currentAccessToken()).toBe('token');
  });

  it('asks for one refresh, however many requests need it at once', async () => {
    let finish;
    client.refresh.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const waiting = [refreshAccessToken(), refreshAccessToken(), refreshAccessToken()];
    await Promise.resolve();
    await Promise.resolve();
    finish('fresh-token');

    expect(await Promise.all(waiting)).toEqual(['fresh-token', 'fresh-token', 'fresh-token']);
    expect(client.refresh).toHaveBeenCalledTimes(1);
  });

  it('answers null when the refresh fails', async () => {
    client.refresh.mockRejectedValue(new Error('revoked'));
    expect(await refreshAccessToken()).toBeNull();
  });

  it('ends a sign-in more than 7 days old instead of refreshing it', async () => {
    recordSignIn(Date.now() - 8 * DAY);
    expect(await refreshAccessToken()).toBeNull();
    expect(client.refresh).not.toHaveBeenCalled();
    expect(client.signOut).toHaveBeenCalledTimes(1);
  });
});
