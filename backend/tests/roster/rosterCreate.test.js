// rosterCreate.test.js
// Creating rosters, and who may see them: managers create drafts within the
// date-range cap; workers never see a draft - not even by asking for it
// directly, which answers 404 rather than 403.
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
beforeEach(() => ({ app, ownerToken, workerToken, orgId } = world));

const makeRoster = (body) => postRoster(world, body);

describe('rosters', () => {
  it('creates a draft', async () => {
    const res = await makeRoster();
    expect(res.status).toBe(201);
    expect(res.body.roster.status).toBe('draft');
  });

  it('refuses a worker creating one', async () => {
    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/rosters`)
      .set(auth(workerToken))
      .send({ name: 'Mine', startDate: '2026-03-02', endDate: '2026-03-08' });

    expect(res.status).toBe(403);
  });

  it('rejects a backwards date range', async () => {
    const res = await makeRoster({ startDate: '2026-03-08', endDate: '2026-03-02' });
    expect(res.status).toBe(422);
  });

  it('rejects a range longer than the cap', async () => {
    const res = await makeRoster({ startDate: '2026-03-01', endDate: '2026-06-01' });
    expect(res.status).toBe(422);
  });

  it('hides drafts from workers but shows them to managers', async () => {
    await makeRoster();

    const asManager = await request(app)
      .get(`/api/v1/orgs/${orgId}/rosters`)
      .set(auth(ownerToken));
    const asWorker = await request(app)
      .get(`/api/v1/orgs/${orgId}/rosters`)
      .set(auth(workerToken));

    expect(asManager.body.rosters).toHaveLength(1);
    expect(asWorker.body.rosters).toHaveLength(0);
  });

  it('404s rather than 403s when a worker asks for a draft directly', async () => {
    const created = await makeRoster();

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/rosters/${created.body.roster.id}`)
      .set(auth(workerToken));

    // 403 would confirm the draft exists, which is not theirs to learn.
    expect(res.status).toBe(404);
  });
});
