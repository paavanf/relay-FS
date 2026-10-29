// sessionLimit.test.js
// The API refuses a sign-in more than 7 days old, whichever route it asks
// for and however freshly its token was refreshed: the token says when the
// session signed in (its amr claim), and that is what counts.
//   signed in 6 days ago   GET /auth/me answers 200
//   signed in 8 days ago   401 SESSION_EXPIRED - the frontend's cue to end
//                          the session and say why - and no account is made

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { useEmptyDb } from '../helpers/apiTest.js';
import { auth, tokenFor } from '../helpers/identity.js';
import { User } from '../../src/models/index.js';

const world = useEmptyDb();
const DAY = 24 * 60 * 60 * 1000;
const signedIn = (daysAgo, claims) => tokenFor({ email: 'kim@example.com', signedInAt: Date.now() - daysAgo * DAY, claims });
const me = async (token) => request(world.app).get('/api/v1/auth/me').set(auth(await token));

describe('the 7-day limit on a sign-in, at the API', () => {
  it('accepts a token whose sign-in is 6 days old', async () => {
    expect((await me(signedIn(6))).status).toBe(200);
  });

  it('refuses one whose sign-in is 8 days old with SESSION_EXPIRED, on any route', async () => {
    const res = await me(signedIn(8));
    expect([res.status, res.body.error.code]).toEqual([401, 'SESSION_EXPIRED']);
    expect(res.body.error.message).toBe('Sign-ins last 7 days. Sign in again to carry on.');

    const org = await request(world.app).post('/api/v1/orgs').set(auth(await signedIn(8))).send({ name: 'Ward A', timezone: 'Europe/London' });
    expect([org.status, org.body.error.code]).toEqual([401, 'SESSION_EXPIRED']);
    expect(await User.countDocuments()).toBe(0);
  });

  it('refuses a token that does not say when it signed in', async () => {
    const res = await me(signedIn(0, { amr: [] }));
    expect([res.status, res.body.error.code]).toEqual([401, 'UNAUTHORIZED']);
  });
});
