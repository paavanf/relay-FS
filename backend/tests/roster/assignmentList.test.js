// assignmentList.test.js
// GET /assignments, which My Shifts reads: nothing from a draft, published
// shifts only - a worker's own - filtered by dates, and never another
// organisation's roster.
//
// The world - an owner, a nurse and a day shift template - is rosterWorld.js.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Roster } from '../../src/models/index.js';
import { useRosterWorld, auth, makeRoster as postRoster } from './rosterWorld.js';

const world = useRosterWorld();
let app;
let ownerToken;
let workerToken;
let orgId;
let templateId;
let workerMembershipId;
beforeEach(() => ({ app, ownerToken, workerToken, orgId, templateId, workerMembershipId } = world));

const makeRoster = (body) => postRoster(world, body);

describe('GET /assignments', () => {
  it('returns nothing while the roster is only a draft', async () => {
    const created = await makeRoster();
    await request(app)
      .post(`/api/v1/orgs/${orgId}/assignments`)
      .set(auth(ownerToken))
      .send({ rosterId: created.body.roster.id, membershipId: workerMembershipId, shiftTemplateId: templateId, date: '2026-03-02' });

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/assignments`)
      .set(auth(workerToken));

    // A draft is not a commitment; My Shifts must not show one.
    expect(res.body.assignments).toEqual([]);
  });

  it('returns published shifts, and only the caller-s own for a worker', async () => {
    const created = await makeRoster();
    const rosterId = created.body.roster.id;

    const members = await request(app).get(`/api/v1/orgs/${orgId}/members`).set(auth(ownerToken));
    const ownerMembershipId = members.body.members.find((m) => m.email === 'owner@example.com').id;

    for (const membershipId of [workerMembershipId, ownerMembershipId]) {
      await request(app)
        .post(`/api/v1/orgs/${orgId}/assignments`)
        .set(auth(ownerToken))
        .send({ rosterId, membershipId, shiftTemplateId: templateId, date: '2026-03-02' });
    }

    await request(app).post(`/api/v1/orgs/${orgId}/rosters/${rosterId}/publish`).set(auth(ownerToken));

    const asWorker = await request(app)
      .get(`/api/v1/orgs/${orgId}/assignments`)
      .set(auth(workerToken));

    expect(asWorker.body.assignments).toHaveLength(1);
    expect(asWorker.body.assignments[0].membershipId).toBe(workerMembershipId);
  });

  it('filters by date range', async () => {
    const created = await makeRoster();
    const rosterId = created.body.roster.id;

    for (const date of ['2026-03-02', '2026-03-06']) {
      await request(app)
        .post(`/api/v1/orgs/${orgId}/assignments`)
        .set(auth(ownerToken))
        .send({ rosterId, membershipId: workerMembershipId, shiftTemplateId: templateId, date });
    }
    await request(app).post(`/api/v1/orgs/${orgId}/rosters/${rosterId}/publish`).set(auth(ownerToken));

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/assignments?from=2026-03-05&to=2026-03-10`)
      .set(auth(workerToken));

    expect(res.body.assignments).toHaveLength(1);
    expect(res.body.assignments[0].date).toBe('2026-03-06');
  });

  it('ignores a roster from another organisation', async () => {
    await Roster.create({ orgId: workerMembershipId, name: 'Elsewhere', startDate: '2026-03-02', endDate: '2026-03-08', status: 'published' });

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/assignments`)
      .set(auth(ownerToken));

    expect(res.body.assignments).toEqual([]);
  });
});
