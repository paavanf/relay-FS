// seedDemo.test.js
// The demo seed, run against the in-memory server - never a real database:
// what it builds, that people can sign in with what it prints, and that a
// rerun gives the same data - its swap requests included - without touching
// anyone else's. What those swap requests show is seedDemoSwaps.test.js.
//
// The three tests run in order and share one database: the second signs in
// to what the first built, and the third reruns on top of it.

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { startTestServer, stopTestDb } from '../helpers/db.js';
import { seed, inDatabase, snapshot } from '../helpers/demoSeed.js';
import { tokenFor } from '../helpers/identity.js';
import { createApp } from '../../src/app.js';
import { WARD } from '../../scripts/demo/ward.js';
import { User, Organisation } from '../../src/models/index.js';

const SLOW = 120_000;

beforeAll(async () => {
  await startTestServer();
}, SLOW);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// A visitor signed in as a demo account: the first request links the test
// token to the seeded account by its email.
async function login(app, email) {
  const token = await tokenFor({ email });
  const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
  return { status: me.status, body: { ...me.body, accessToken: token } };
}

describe('the demo seed', () => {
  it('builds the ward, five published weeks - two of them ahead - and a two-week draft', async () => {
    expect(await seed(['--yes'])).toBe(0);
    const built = await snapshot();

    expect(built).toMatchObject({ users: 14, organisations: 1, memberships: 14, qualifications: 3, templates: 3, coverage: 21 });
    expect(new Set(built.availability.map((entry) => entry.split(' ')[1]))).toEqual(new Set(['unavailable', 'prefer', 'avoid']));
    expect(built.rosters).toEqual([
      '2026-02-16 2026-02-22 published',
      '2026-02-23 2026-03-01 published',
      '2026-03-02 2026-03-08 published',
      '2026-03-09 2026-03-15 published',
      '2026-03-16 2026-03-22 published',
      '2026-03-23 2026-04-05 draft',
    ]);
    expect(built.assignments.length).toBeGreaterThan(200);
    // Everyone on the rota is measured; the owner and manager are not on it.
    expect(built.measured).toBe(12);
  }, SLOW);

  it('lets people sign in to the demo accounts, and gives workers a fairness comparison', async () => {
    await inDatabase('relay-demo', async () => {
      const app = createApp();
      const owner = await login(app, 'owner@relay.test');
      expect(owner.status).toBe(200);
      expect(owner.body.memberships).toEqual([expect.objectContaining({ orgName: WARD.name, role: 'owner', isDemo: true })]);

      const asha = await login(app, 'asha@relay.test');
      const fairness = await request(app)
        .get(`/api/v1/orgs/${asha.body.memberships[0].orgId}/fairness`)
        .set('Authorization', `Bearer ${asha.body.accessToken}`);
      expect(fairness.body.comparison.available).toBe(true);
      expect(fairness.body.you.normalisedBurden).toBeGreaterThan(0);
    });
  }, SLOW);

  it('reruns to the same data, duplicating nothing and leaving everything else alone', async () => {
    const first = await snapshot();
    await inDatabase('relay-demo', async () => {
      await User.create({ name: 'Real Person', email: 'real@example.com' });
      await Organisation.create({ name: 'Real Ward' });
    });

    expect(await seed(['--yes'])).toBe(0);

    expect(await snapshot()).toEqual({ ...first, users: first.users + 1, organisations: first.organisations + 1 });
    expect(await inDatabase('relay-demo', () => User.exists({ email: 'real@example.com' }))).toBeTruthy();
  }, SLOW);
});
