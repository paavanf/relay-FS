// rosterRules.test.js
// The organisation's scheduling rules.
//
// The property worth guarding hardest is the refusal of a partial update. The
// constraint engine skips any limit it cannot read as a number, so accepting
// { minRestHours: 12 } on its own would not relax the other two rules - it
// would switch them off, and the next generated roster would breach them
// while reporting itself as valid.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Organisation } from '../../src/models/index.js';
import { DEFAULT_ROSTER_RULES } from '../../src/config/constants.js';

let app;
let ownerToken;
let memberToken;
let orgId;

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const VALID = { minRestHours: 12, maxConsecutiveDays: 4, maxHoursPerWeek: 40 };

async function signUp(email) {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Person', email, password: 'password123' });

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'password123' });

  return res.body.accessToken;
}

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearTestDb();

  ownerToken = await signUp('owner@example.com');
  const org = await request(app)
    .post('/api/v1/orgs')
    .set(auth(ownerToken))
    .send({ name: 'Ward A', timezone: 'Europe/London' });
  orgId = org.body.id;

  memberToken = await signUp('nurse@example.com');
  const invite = await request(app)
    .post(`/api/v1/orgs/${orgId}/invites`)
    .set(auth(ownerToken))
    .send({ email: 'nurse@example.com', role: 'member' });
  const token = invite.body.inviteLink.split('/invite/')[1];
  await request(app).post(`/api/v1/orgs/invites/${token}/accept`).set(auth(memberToken));
});

describe('GET /orgs/:orgId/roster-rules', () => {
  it('returns the defaults for a new organisation', async () => {
    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken));

    expect(res.status).toBe(200);
    expect(res.body.rosterRules).toEqual(DEFAULT_ROSTER_RULES);
  });

  it('lets an ordinary member read the rules they are scheduled under', async () => {
    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(memberToken));

    expect(res.status).toBe(200);
    expect(res.body.rosterRules.minRestHours).toBe(DEFAULT_ROSTER_RULES.minRestHours);
  });

  it('falls back to the defaults for an organisation saved before rules existed', async () => {
    await Organisation.updateOne({ _id: orgId }, { $unset: { rosterRules: '' } });

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken));

    // Never an empty object: an absent rule would silently disable that check.
    expect(res.body.rosterRules).toEqual(DEFAULT_ROSTER_RULES);
  });

  it('404s for an organisation the caller does not belong to', async () => {
    const strangerToken = await signUp('other@example.com');
    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(strangerToken));

    expect(res.status).toBe(404);
  });
});

describe('PUT /orgs/:orgId/roster-rules', () => {
  it('saves all three rules', async () => {
    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken))
      .send(VALID);

    expect(res.status).toBe(200);
    expect(res.body.rosterRules).toEqual(VALID);
  });

  it('persists them, so generation reads the new values', async () => {
    await request(app)
      .put(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken))
      .send(VALID);

    const org = await Organisation.findById(orgId).lean();
    expect(org.rosterRules).toMatchObject(VALID);
  });

  it('refuses an ordinary member', async () => {
    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(memberToken))
      .send(VALID);

    expect(res.status).toBe(403);
  });

  it('refuses a partial update, which would disable the missing rules', async () => {
    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken))
      .send({ minRestHours: 12 });

    expect(res.status).toBe(422);

    // And nothing changed.
    const org = await Organisation.findById(orgId).lean();
    expect(org.rosterRules.maxHoursPerWeek).toBe(DEFAULT_ROSTER_RULES.maxHoursPerWeek);
  });

  it('refuses a null rule', async () => {
    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken))
      .send({ ...VALID, maxHoursPerWeek: null });

    expect(res.status).toBe(422);
  });

  it('refuses an unknown field rather than silently dropping it', async () => {
    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken))
      .send({ ...VALID, minRestMinutes: 30 });

    expect(res.status).toBe(422);
  });

  it('rejects values outside the allowed range', async () => {
    const outOfRange = [
      { ...VALID, maxHoursPerWeek: 100 },
      { ...VALID, minRestHours: 25 },
      { ...VALID, minRestHours: -1 },
      { ...VALID, maxConsecutiveDays: 0 },
      { ...VALID, maxConsecutiveDays: 15 },
    ];

    for (const body of outOfRange) {
      const res = await request(app)
        .put(`/api/v1/orgs/${orgId}/roster-rules`)
        .set(auth(ownerToken))
        .send(body);

      expect(res.status).toBe(422);
    }
  });

  it('rejects a fractional value', async () => {
    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/roster-rules`)
      .set(auth(ownerToken))
      .send({ ...VALID, minRestHours: 11.5 });

    expect(res.status).toBe(422);
  });
});
