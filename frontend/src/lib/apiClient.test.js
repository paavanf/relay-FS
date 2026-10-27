// apiClient.test.js
// Every request carries the signed-in person's access token. When the API
// answers 401 the token is refreshed once and the request tried once more;
// when there is no fresh token to be had, the 401 stands.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { currentAccessToken, refreshAccessToken } from './auth/session.js';
import { api } from './apiClient.js';

vi.mock('./auth/session.js', () => ({ currentAccessToken: vi.fn(), refreshAccessToken: vi.fn() }));
vi.mock('./slowRequests.js', () => ({ trackRequest: () => () => {} }));

const answer = (status, body = {}) => ({ status, ok: status < 300, json: async () => body });
const tokensSent = () => fetch.mock.calls.map(([, init]) => init.headers.Authorization);

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.mocked(currentAccessToken).mockResolvedValue('old-token');
  vi.mocked(refreshAccessToken).mockReset();
});

describe('the API client', () => {
  it('sends the access token', async () => {
    fetch.mockResolvedValueOnce(answer(200, { ok: true }));
    expect(await api.get('/auth/me')).toEqual({ ok: true });
    expect(tokensSent()).toEqual(['Bearer old-token']);
  });

  it('refreshes once on a 401 and tries again with the new token', async () => {
    fetch.mockResolvedValueOnce(answer(401)).mockResolvedValueOnce(answer(200, { user: 'me' }));
    vi.mocked(refreshAccessToken).mockResolvedValue('new-token');

    expect(await api.get('/auth/me')).toEqual({ user: 'me' });
    expect(tokensSent()).toEqual(['Bearer old-token', 'Bearer new-token']);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it('lets the 401 stand when the session is really over', async () => {
    fetch.mockResolvedValueOnce(answer(401, { error: { code: 'UNAUTHORIZED', message: 'Access token expired' } }));
    vi.mocked(refreshAccessToken).mockResolvedValue(null);

    await expect(api.get('/orgs')).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
