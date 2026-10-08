// memberDeactivate.test.js
// DELETE /orgs/:orgId/members/:membershipId - a soft deactivation.
//
// Pinned hardest: the person's shifts come off DRAFT rosters and are recorded
// as unfilled, while PUBLISHED rosters keep them as history.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Assignment, Roster } from '../../src/models/index.js';
import { auth, buildOrg } from '../helpers/orgBuilder.js';

let app;
let org;
let templateId;

const deactivate = (membershipId, token) =>
  request(app).delete(`/api/v1/orgs/${org.orgId}/members/${membershipId}`).set(auth(token));

async function rosterWithShift(status, membershipId, date) {
  const roster = await Roster.create({ orgId: org.orgId, name: status, startDate: date, endDate: date, status });
  await Assignment.create({
    orgId: org.orgId, rosterId: roster._id, membershipId, shiftTemplateId: templateId, date,
    startsAt: new Date(`${date}T07:00:00Z`), endsAt: new Date(`${date}T15:00:00Z`),
  });
  return roster;
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
  const template = await request(app)
    .post(`/api/v1/orgs/${org.orgId}/shift-templates`)
    .set(auth(org.owner.token))
    .send({ name: 'Day', startLocal: '07:00', endLocal: '15:00', category: 'day' });
  templateId = template.body.template._id;
});

describe('deactivating a member', () => {
  it('takes their draft shifts off as unfilled, and keeps published ones', async () => {
    const draft = await rosterWithShift('draft', org.worker.membershipId, '2026-03-09');
    const published = await rosterWithShift('published', org.worker.membershipId, '2026-03-02');

    const res = await deactivate(org.worker.membershipId, org.manager.token);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ removedDraftShifts: 1, member: { status: 'inactive' } });

    const shown = await request(app).get(`/api/v1/orgs/${org.orgId}/rosters/${draft._id}`).set(auth(org.owner.token));
    expect(shown.body.assignments).toHaveLength(0);
    expect(shown.body.unfilledSlots).toEqual([
      expect.objectContaining({ date: '2026-03-09', reason: 'Nobody is on this shift since Wren Worker left the team.' }),
    ]);
    expect(await Assignment.countDocuments({ rosterId: published._id })).toBe(1);
  });

  it('shuts them out of the organisation and off the team list', async () => {
    await deactivate(org.worker.membershipId, org.owner.token);

    expect((await request(app).get(`/api/v1/orgs/${org.orgId}/members`).set(auth(org.worker.token))).status).toBe(404);
    const me = await request(app).get('/api/v1/auth/me').set(auth(org.worker.token));
    expect(me.body.memberships).toHaveLength(0);
    const team = await request(app).get(`/api/v1/orgs/${org.orgId}/members`).set(auth(org.owner.token));
    expect(team.body.members.map((m) => m.id)).not.toContain(org.worker.membershipId);
  });

  it('lets a manager deactivate members, but only an owner deactivate a manager', async () => {
    expect((await deactivate(org.manager.membershipId, org.manager.token)).status).toBe(403);
    expect((await deactivate(org.manager.membershipId, org.owner.token)).status).toBe(200);
  });

  it('never deactivates the last owner', async () => {
    expect((await deactivate(org.owner.membershipId, org.owner.token)).status).toBe(409);
  });
});
