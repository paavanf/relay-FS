// availability.test.js
// Availability (Milestone 2): a member sets and reads their own, as a whole
// set; a manager may read and set anyone's; a member may not reach anyone
// else's.
//
// The middleware chain on nested routers matters most here: :orgId has to
// survive the mount path (mergeParams), and members read configuration without
// being able to change it. The world - an owner and one member - is configWorld.js.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { useConfigWorld, auth } from './configWorld.js';

const world = useConfigWorld();
let app;
let ownerToken;
let memberToken;
let orgId;
let memberMembershipId;
beforeEach(() => ({ app, ownerToken, memberToken, orgId, memberMembershipId } = world));

describe('availability', () => {
  const entries = [
    { type: 'recurring', dayOfWeek: 1, status: 'unavailable', note: 'Class' },
    { type: 'exception', date: '2026-12-24T00:00:00.000Z', status: 'avoid', note: '' },
  ];

  it('lets a member set and read their own', async () => {
    const set = await request(app)
      .put(`/api/v1/orgs/${orgId}/availability/me`)
      .set(auth(memberToken))
      .send({ entries });
    expect(set.status).toBe(200);
    expect(set.body.entries).toHaveLength(2);

    const read = await request(app)
      .get(`/api/v1/orgs/${orgId}/availability/me`)
      .set(auth(memberToken));
    expect(read.body.entries).toHaveLength(2);
  });

  it('replaces the whole set rather than appending', async () => {
    const url = `/api/v1/orgs/${orgId}/availability/me`;
    await request(app).put(url).set(auth(memberToken)).send({ entries });

    const replaced = await request(app)
      .put(url)
      .set(auth(memberToken))
      .send({ entries: [{ type: 'recurring', dayOfWeek: 5, status: 'prefer' }] });

    expect(replaced.body.entries).toHaveLength(1);
    expect(replaced.body.entries[0].dayOfWeek).toBe(5);
  });

  it('accepts an empty set, clearing everything', async () => {
    const url = `/api/v1/orgs/${orgId}/availability/me`;
    await request(app).put(url).set(auth(memberToken)).send({ entries });

    const cleared = await request(app).put(url).set(auth(memberToken)).send({ entries: [] });
    expect(cleared.body.entries).toHaveLength(0);
  });

  it('requires a weekday on a recurring entry', async () => {
    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/availability/me`)
      .set(auth(memberToken))
      .send({ entries: [{ type: 'recurring', status: 'unavailable' }] });

    expect(res.status).toBe(422);
  });

  it('lets a manager read and set a member’s availability', async () => {
    const url = `/api/v1/orgs/${orgId}/availability/${memberMembershipId}`;

    const set = await request(app).put(url).set(auth(ownerToken)).send({ entries });
    expect(set.status).toBe(200);

    const read = await request(app).get(url).set(auth(ownerToken));
    expect(read.body.entries).toHaveLength(2);
  });

  it('stops a member reaching someone else’s availability', async () => {
    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/availability/${memberMembershipId}`)
      .set(auth(memberToken));

    expect(res.status).toBe(403);
  });
});
