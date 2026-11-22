// apiClient.failures.test.js
// When the API cannot be reached, or keeps refusing: a network failure
// becomes one clear error (status 0, "Cannot reach the Relay API.") that the
// page can show with "Try again", and a 401 that survives a refresh is tried
// once more only - never a loop.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { currentAccessToken, refreshAccessToken } from './auth/session.js';
import { api } from './apiClient.js';

vi.mock('./auth/session.js', () => ({ currentAccessToken: vi.fn(), refreshAccessToken: vi.fn() }));
vi.mock('./auth/authClient.js', () => ({ authClient: async () => ({ signOut: async () => {} }) }));
vi.mock('./slowRequests.js', () => ({ trackRequest: () => () => {} }));

const answer = (status, body = {}) => ({ status, ok: status < 300, json: async () => body, clone: () => answer(status, body) });

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.mocked(currentAccessToken).mockResolvedValue('old-token');
  vi.mocked(refreshAccessToken).mockReset();
});

describe('the API client, when things go wrong', () => {
  it('turns a network failure into one clear error, asked once', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(api.get('/orgs')).rejects.toMatchObject({ status: 0, message: 'Cannot reach the Relay API.' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('tries a 401 once more after a refresh, and then lets it stand - never a loop', async () => {
    fetch.mockResolvedValue(answer(401, { error: { code: 'UNAUTHORIZED', message: 'Access token expired' } }));
    vi.mocked(refreshAccessToken).mockResolvedValue('new-token');

    await expect(api.get('/orgs')).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });
});
