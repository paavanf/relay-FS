// assignmentRoles.test.js
// Hand edits name the role they fill, and the person must hold exactly it.
//
// The ward: Monday's day shift needs a charge nurse (CN) and a registered
// nurse (RN). Cara holds both; Remy is an RN only - qualified for the shift
// under the old any-of rule, but not for the charge nurse's place.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { auth, buildOrg, join } from '../helpers/orgBuilder.js';

const MONDAY = '2026-03-02';
let app;
let w; // the ward

const post = (path, body, token = w.owner.token) => request(app).post(`/api/v1/orgs/${w.orgId}${path}`).set(auth(token)).send(body);
const assign = (who, role, extra = {}) =>
  post('/assignments', { rosterId: w.rosterId, membershipId: who.membershipId, shiftTemplateId: w.dayId, date: MONDAY, ...extra, ...(role ? { slotQualificationId: role } : {}) });

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  w = await buildOrg(app);
  const qualification = async (name, code) => (await post('/qualifications', { name, code })).body.qualification._id;
  w.CN = await qualification('Charge Nurse', 'CN');
  w.RN = await qualification('Registered Nurse', 'RN');
  w.HCA = await qualification('Healthcare Assistant', 'HCA');
  w.cara = await join(app, { orgId: w.orgId, ownerToken: w.owner.token, name: 'Cara Charge', email: 'cara@example.com', qualificationIds: [w.CN, w.RN] });
  w.remy = await join(app, { orgId: w.orgId, ownerToken: w.owner.token, name: 'Remy Nurse', email: 'remy@example.com', qualificationIds: [w.RN] });
  w.dayId = (await post('/shift-templates', { name: 'Day', startLocal: '07:00', endLocal: '15:00', category: 'day' })).body.template._id;
  const requirements = [{ qualificationId: w.CN, count: 1 }, { qualificationId: w.RN, count: 1 }];
  await request(app).put(`/api/v1/orgs/${w.orgId}/coverage`).set(auth(w.owner.token)).send({ shiftTemplateId: w.dayId, dayOfWeek: 1, requirements });
  w.rosterId = (await post('/rosters', { name: 'Week 10', startDate: MONDAY, endDate: '2026-03-08' })).body.roster.id;
});

describe('roles on hand-made assignments', () => {
  it('asks which role a shift with roles is being filled for', async () => {
    const res = await assign(w.cara, null);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Choose which role on this shift the person fills.');
  });

  it("refuses a role the shift does not need that day", async () => {
    expect((await assign(w.cara, w.HCA)).status).toBe(400);
  });

  it("refuses someone who does not hold the role, though they hold another of the shift's", async () => {
    const res = await assign(w.remy, w.CN);
    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('Not qualified for this role on the shift.');
  });

  it('stores the role and returns it', async () => {
    const res = await assign(w.cara, w.CN);
    expect(res.status).toBe(201);
    expect(res.body.assignment.slotQualificationId).toBe(w.CN);

    const roster = await request(app).get(`/api/v1/orgs/${w.orgId}/rosters/${w.rosterId}`).set(auth(w.owner.token));
    expect(roster.body.assignments.map((a) => a.slotQualificationId)).toEqual([w.CN]);
  });

  it("tells a dry run the shift's roles", async () => {
    const res = await post('/assignments/validate', { rosterId: w.rosterId, membershipId: w.remy.membershipId, shiftTemplateId: w.dayId, date: MONDAY });
    expect(res.body.roles).toEqual([w.CN, w.RN]);
  });

  it('keeps the role through a reassignment, so the new person must hold it', async () => {
    const created = await assign(w.cara, w.CN);
    const res = await request(app)
      .patch(`/api/v1/orgs/${w.orgId}/assignments/${created.body.assignment.id}`)
      .set(auth(w.owner.token))
      .send({ membershipId: w.remy.membershipId });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('Not qualified for this role on the shift.');
  });
});
