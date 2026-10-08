// hoursRecompute.test.js
// Contracted hours are what fairness normalises against, so changing them
// must rebuild the ledger straight away.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Assignment, Roster } from '../../src/models/index.js';
import { auth, buildOrg } from '../helpers/orgBuilder.js';

let app;
let org;

const ledgerRowOf = async (membershipId) => {
  const res = await request(app).get(`/api/v1/orgs/${org.orgId}/fairness`).set(auth(org.owner.token));
  return res.body.rows.find((row) => row.membershipId === membershipId);
};

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

  const template = await request(app)
    .post(`/api/v1/orgs/${org.orgId}/shift-templates`)
    .set(auth(org.owner.token))
    .send({ name: 'Day', startLocal: '07:00', endLocal: '15:00', category: 'day' });
  const roster = await Roster.create({
    orgId: org.orgId, name: 'March', startDate: '2026-03-02', endDate: '2026-03-08', status: 'published',
  });
  await Assignment.create({
    orgId: org.orgId,
    rosterId: roster._id,
    membershipId: org.worker.membershipId,
    shiftTemplateId: template.body.template._id,
    date: '2026-03-02',
    startsAt: new Date('2026-03-02T07:00:00Z'),
    endsAt: new Date('2026-03-02T15:00:00Z'),
  });
  await request(app).post(`/api/v1/orgs/${org.orgId}/fairness/recompute`).set(auth(org.owner.token));
});

describe('changing contracted hours', () => {
  it('recomputes the fairness ledger', async () => {
    const before = await ledgerRowOf(org.worker.membershipId);
    expect(before.contractedHoursPerWeek).toBe(0); // measured on the 40-hour fallback

    const res = await request(app)
      .patch(`/api/v1/orgs/${org.orgId}/members/${org.worker.membershipId}`)
      .set(auth(org.manager.token))
      .send({ contractedHoursPerWeek: 20 });
    expect(res.status).toBe(200);

    const after = await ledgerRowOf(org.worker.membershipId);
    expect(after.contractedHoursPerWeek).toBe(20);
    // Half the hours to be measured against, so twice the normalised burden.
    expect(after.normalisedBurden).toBeCloseTo(before.normalisedBurden * 2);
  });
});
