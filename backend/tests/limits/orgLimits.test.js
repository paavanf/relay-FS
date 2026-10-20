// orgLimits.test.js
// The two limits counted from the database (config/constants.js):
//
//   organisations   one account creates at most five, ever - and the
//                   refusal says the limit does not reset
//   invites         one organisation sends at most twenty a day, revoked
//                   ones included; another organisation is unaffected

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { auth, signUp, createOrg, sendInvite } from '../helpers/orgBuilder.js';
import { ORGANISATIONS_PER_USER, INVITE_LIMIT } from '../../src/config/constants.js';
import { expectLimited } from './limitAsserts.js';

let app;
let token;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);
afterAll(stopTestDb);

beforeEach(async () => {
  await clearTestDb();
  token = await signUp(app, 'Olive Owner', 'owner@example.com');
});

describe('abuse limits counted from the database', () => {
  it(`lets one account create ${ORGANISATIONS_PER_USER} organisations, and says the limit does not reset`, async () => {
    for (let i = 1; i <= ORGANISATIONS_PER_USER; i += 1) await createOrg(app, token, `Ward ${i}`);
    const res = await request(app).post('/api/v1/orgs').set(auth(token)).send({ name: 'Ward six', timezone: 'Europe/London' });
    expect(res.status).toBe(429);
    expect(res.body.error).toMatchObject({ code: 'RATE_LIMITED' });
    expect(res.body.error.message).toBe(
      `You have already created ${ORGANISATIONS_PER_USER} organisations, the most one account can create. This limit does not reset over time.`,
    );
  });

  it(`sends ${INVITE_LIMIT.max} invites a day per organisation, counting revoked ones`, async () => {
    const orgId = await createOrg(app, token);
    const first = await sendInvite(app, { orgId, token, email: 'invitee0@example.com' });
    await request(app).delete(`/api/v1/orgs/${orgId}/invites/${first.inviteId}`).set(auth(token));
    for (let i = 1; i < INVITE_LIMIT.max; i += 1) {
      expect((await sendInvite(app, { orgId, token, email: `invitee${i}@example.com` })).res.status).toBe(201);
    }

    const { res } = await sendInvite(app, { orgId, token, email: 'one-more@example.com' });
    expectLimited(res, /^This organisation has sent 20 invites in the last 24 hours, the most it can send in a day\./);
    expect(res.body.error.message).toMatch(/Try again in about 24 hours\.$/);

    const otherOrg = await createOrg(app, token, 'Ward B');
    expect((await sendInvite(app, { orgId: otherOrg, token, email: 'one-more@example.com' })).res.status).toBe(201);
  });
});
