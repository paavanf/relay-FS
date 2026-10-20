// assignmentMoves.test.js
// Changing an assignment: moving a shift without it clashing with itself,
// deleting one, and every edit refused once the roster is published.
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

  it('moves an assignment without it clashing with itself', async () => {
    const created = await assign();

    const res = await request(app)
      .patch(`/api/v1/orgs/${orgId}/assignments/${created.body.assignment.id}`)
      .set(auth(ownerToken))
      .send({ date: '2026-03-04' });

    expect(res.status).toBe(200);
    expect(res.body.assignment.date).toBe('2026-03-04');
  });

  it('deletes one', async () => {
    const created = await assign();

    const res = await request(app)
      .delete(`/api/v1/orgs/${orgId}/assignments/${created.body.assignment.id}`)
      .set(auth(ownerToken));

    expect(res.status).toBe(204);
  });

  it('refuses every edit once the roster is published', async () => {
    const created = await assign();
    await request(app)
      .post(`/api/v1/orgs/${orgId}/rosters/${rosterId}/publish`)
      .set(auth(ownerToken));

    const added = await assign({ date: '2026-03-06' });
    const moved = await request(app)
      .patch(`/api/v1/orgs/${orgId}/assignments/${created.body.assignment.id}`)
      .set(auth(ownerToken))
      .send({ date: '2026-03-07' });
    const removed = await request(app)
      .delete(`/api/v1/orgs/${orgId}/assignments/${created.body.assignment.id}`)
      .set(auth(ownerToken));

    expect([added.status, moved.status, removed.status]).toEqual([409, 409, 409]);
  });
});
