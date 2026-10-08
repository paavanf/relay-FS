// memberUpdate.test.js
// PATCH /orgs/:orgId/members/:membershipId - who may change what.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { auth, buildOrg, signUp, createOrg } from '../helpers/orgBuilder.js';

let app;
let org;

const patch = (membershipId, token, body) =>
  request(app).patch(`/api/v1/orgs/${org.orgId}/members/${membershipId}`).set(auth(token)).send(body);

async function qualificationIn(orgId, token, code) {
  const res = await request(app)
    .post(`/api/v1/orgs/${orgId}/qualifications`)
    .set(auth(token))
    .send({ name: `Qualification ${code}`, code });
  return String(res.body.qualification._id);
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
  org = await buildOrg(app);
});

describe('changing a member', () => {
  it('lets only an owner change roles', async () => {
    expect((await patch(org.worker.membershipId, org.manager.token, { role: 'manager' })).status).toBe(403);

    const res = await patch(org.worker.membershipId, org.owner.token, { role: 'manager' });
    expect(res.status).toBe(200);
    expect(res.body.member.role).toBe('manager');
  });

  it('never demotes the last owner, but allows it once there is another', async () => {
    expect((await patch(org.owner.membershipId, org.owner.token, { role: 'manager' })).status).toBe(409);

    await patch(org.manager.membershipId, org.owner.token, { role: 'owner' });
    expect((await patch(org.owner.membershipId, org.owner.token, { role: 'manager' })).status).toBe(200);
  });

  it('lets managers set qualifications, employment type and hours', async () => {
    const rn = await qualificationIn(org.orgId, org.owner.token, 'RN');
    const res = await patch(org.worker.membershipId, org.manager.token, {
      qualificationIds: [rn],
      employmentType: 'part-time',
      contractedHoursPerWeek: 22.5,
    });

    expect(res.status).toBe(200);
    expect(res.body.member).toMatchObject({ qualificationIds: [rn], employmentType: 'part-time', contractedHoursPerWeek: 22.5 });
  });

  it('refuses a qualification that belongs to another organisation', async () => {
    const otherOwner = await signUp(app, 'Other Owner', 'other@example.com');
    const foreign = await qualificationIn(await createOrg(app, otherOwner, 'Ward B'), otherOwner, 'RN');

    expect((await patch(org.worker.membershipId, org.owner.token, { qualificationIds: [foreign] })).status).toBe(400);
  });

  it('rejects unknown fields, out-of-range hours and an empty change', async () => {
    for (const body of [{ name: 'Renamed' }, { contractedHoursPerWeek: 81 }, { contractedHoursPerWeek: -1 }, {}]) {
      const res = await patch(org.worker.membershipId, org.owner.token, body);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_FAILED');
    }
  });

  it('keeps workers from changing anyone, themselves included', async () => {
    expect((await patch(org.worker.membershipId, org.worker.token, { contractedHoursPerWeek: 10 })).status).toBe(403);
  });
});
