// productionSignIn.test.js
// Signing in with the app set up as in production - AUTH_MODE=supabase -
// against a local stand-in for the Supabase project (helpers/fakeSupabase.js),
// so the real adapter fetches, caches and checks the project's keys:
//   - while the project cannot be reached, the answer is 503, not 401
//   - a token the project signed signs the person in; the keys are fetched
//     once and then served from the cache
//   - a token signed for another project is refused

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb } from '../helpers/db.js';
import { PRODUCTION_ENV } from '../helpers/productionEnv.js';
import { startFakeSupabase } from '../helpers/fakeSupabase.js';

vi.mock('../../src/utils/logger.js', async () => {
  const quiet = (await import('pino')).default({ level: 'silent' });
  return { logger: quiet, default: quiet };
});

let app;
let project;
const me = (token) => request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
const keyFetches = () => project.state.requests.filter((url) => url.endsWith('/jwks.json')).length;

beforeAll(async () => {
  project = await startFakeSupabase();
  Object.assign(process.env, PRODUCTION_ENV, { SUPABASE_URL: project.url });
  await startTestDb();
  app = (await import('../../src/app.js')).createApp();
});

afterAll(async () => {
  await stopTestDb();
  await project.close();
});

describe('signing in, as in production', () => {
  it('answers 503 while the project cannot be reached, without signing anyone out', async () => {
    project.state.down = true;
    const res = await me(await project.signToken({ email: 'ada@example.com' }));
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AUTH_UNAVAILABLE');
    project.state.down = false;
  });

  it("signs someone in with the project's token, fetching its keys once", async () => {
    const token = await project.signToken({ email: 'Ada@Example.com', name: 'Ada' });
    const fetchesBefore = keyFetches();

    const first = await me(token);
    expect(first.status).toBe(200);
    expect(first.body.user).toMatchObject({ email: 'ada@example.com', name: 'Ada' });
    expect((await me(token)).body.user.id).toBe(first.body.user.id);
    expect(keyFetches() - fetchesBefore).toBe(1);
  });

  it('refuses a token signed for another project', async () => {
    const elsewhere = await project.signToken({ email: 'ada@example.com', issuer: 'https://otherprojectaaaaaaaaaa.supabase.co/auth/v1' });
    expect((await me(elsewhere)).status).toBe(401);
  });
});
