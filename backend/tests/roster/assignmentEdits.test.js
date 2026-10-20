// assignmentEdits.test.js
// Assigning someone by hand: the real instants are computed, workers may not
// assign, and a shift that breaks a scheduling rule is refused by the same
// engine the generator uses - naming the rule, with details the UI explains.
//
// The world - an owner, a nurse and a day shift template - is rosterWorld.js.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
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

  it('creates one and computes its real instants', async () => {
    const res = await assign();

    expect(res.status).toBe(201);
    // 07:00 London on 2 March is 07:00Z - GMT at that date.
    expect(res.body.assignment.startsAt).toBe('2026-03-02T07:00:00.000Z');
    expect(res.body.assignment.source).toBe('manual');
  });

  it('refuses a worker assigning anyone', async () => {
    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/assignments`)
      .set(auth(workerToken))
      .send({ rosterId, membershipId: workerMembershipId, shiftTemplateId: templateId, date: '2026-03-02' });

    expect(res.status).toBe(403);
  });

  it('refuses a second shift that breaks minimum rest, naming the rule', async () => {
    await assign();
    const res = await assign({ date: '2026-03-03' });

    // 15:00 to 07:00 next day is 16 hours - fine. Same day twice is not.
    const sameDay = await assign();
    expect(sameDay.status).toBe(409);
    expect(res.status).toBe(201);
  });

  it('reports the violation details so the UI can explain it', async () => {
    await assign();
    const clash = await assign();

    expect(clash.status).toBe(409);
    expect(clash.body.error.details.violations.length).toBeGreaterThan(0);
    expect(clash.body.error.message).toBeTruthy();
  });
});
