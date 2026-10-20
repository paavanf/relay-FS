// assignmentChecks.test.js
// Checking an assignment without making it: the dry run writes nothing, and
// says so plainly when a placement is allowed.
//
// The world - an owner, a nurse and a day shift template - is rosterWorld.js.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { useRosterWorld, auth, makeRoster as postRoster } from './rosterWorld.js';

const world = useRosterWorld();
let app;
let ownerToken;
let orgId;
let templateId;
let workerMembershipId;
beforeEach(() => ({ app, ownerToken, orgId, templateId, workerMembershipId } = world));

const makeRoster = (body) => postRoster(world, body);

describe('manual assignment', () => {
  let rosterId;

  beforeEach(async () => {
    const created = await makeRoster();
    rosterId = created.body.roster.id;
  });

  function assign(body) {
    return request(app)
      .post(`/api/v1/orgs/${orgId}/assignments`)
      .set(auth(ownerToken))
      .send({ rosterId, membershipId: workerMembershipId, shiftTemplateId: templateId, date: '2026-03-02', ...body });
  }

  it('validates as a dry run without writing anything', async () => {
    await assign();

    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/assignments/validate`)
      .set(auth(ownerToken))
      .send({ rosterId, membershipId: workerMembershipId, shiftTemplateId: templateId, date: '2026-03-02' });

    // A rejected edit is still a successful answer to the question asked.
    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(false);
    expect(res.body.violations.length).toBeGreaterThan(0);

    const roster = await request(app)
      .get(`/api/v1/orgs/${orgId}/rosters/${rosterId}`)
      .set(auth(ownerToken));
    expect(roster.body.assignments).toHaveLength(1);
  });

  it('says a clean assignment is allowed', async () => {
    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/assignments/validate`)
      .set(auth(ownerToken))
      .send({ rosterId, membershipId: workerMembershipId, shiftTemplateId: templateId, date: '2026-03-05' });

    expect(res.body.allowed).toBe(true);
    expect(res.body.violations).toEqual([]);
  });
});
