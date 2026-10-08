// coverageQualification.test.js
// A coverage rule may only ask for this organisation's own qualifications. One
// demanding a qualification nobody here can hold would be unfillable forever.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { auth, signUp, createOrg } from '../helpers/orgBuilder.js';

let app;
let orgId;
let ownerToken;
let templateId;

async function qualificationIn(org, token) {
  const res = await request(app).post(`/api/v1/orgs/${org}/qualifications`).set(auth(token)).send({ name: 'Registered Nurse', code: 'RN' });
  return String(res.body.qualification._id);
}

const putCoverage = (qualificationId) =>
  request(app)
    .put(`/api/v1/orgs/${orgId}/coverage`)
    .set(auth(ownerToken))
    .send({ shiftTemplateId: templateId, dayOfWeek: 1, requirements: [{ qualificationId, count: 1 }] });

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  ownerToken = await signUp(app, 'Olive Owner', 'owner@example.com');
  orgId = await createOrg(app, ownerToken, 'Ward A');
  const template = await request(app)
    .post(`/api/v1/orgs/${orgId}/shift-templates`)
    .set(auth(ownerToken))
    .send({ name: 'Day', startLocal: '07:00', endLocal: '15:00', category: 'day' });
  templateId = String(template.body.template._id);
});

describe('coverage qualifications', () => {
  it('accepts a qualification of this organisation', async () => {
    expect((await putCoverage(await qualificationIn(orgId, ownerToken))).status).toBe(200);
  });

  it('refuses one that belongs to another organisation', async () => {
    const otherOwner = await signUp(app, 'Other Owner', 'other@example.com');
    const foreign = await qualificationIn(await createOrg(app, otherOwner, 'Ward B'), otherOwner);

    expect((await putCoverage(foreign)).status).toBe(400);
  });
});
