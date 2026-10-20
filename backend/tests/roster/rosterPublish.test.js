// rosterPublish.test.js
// Reading a roster - its assignments and unfilled slots, with the counts of
// who each rule stopped - and publishing it: once, after which workers see it.
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
beforeEach(() => ({ app, ownerToken, workerToken, orgId } = world));

const makeRoster = (body) => postRoster(world, body);

describe('rosters', () => {
  it('returns the roster with its assignments and unfilled slots', async () => {
    const created = await makeRoster();

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/rosters/${created.body.roster.id}`)
      .set(auth(ownerToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('assignments');
    expect(res.body).toHaveProperty('unfilledSlots');
  });

  it('returns unfilled slots with the counts of who each rule stopped', async () => {
    const created = await makeRoster();
    const rosterId = created.body.roster.id;

    // What the generator writes when it cannot cover a slot. An empty roster
    // has no unfilled slots, so without this the conversion is never run.
    await Roster.updateOne(
      { _id: rosterId },
      {
        $set: {
          unfilledSlots: [
            {
              slotId: 'slot-1',
              date: '2026-03-02',
              qualifiedCount: 3,
              blockedBy: { MIN_REST: 2, MAX_WEEKLY_HOURS: 1 },
              reason: '3 hold this qualification - 2 would breach minimum rest',
            },
          ],
        },
      },
    );

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/rosters/${rosterId}`)
      .set(auth(ownerToken));

    expect(res.status).toBe(200);
    expect(res.body.unfilledSlots).toHaveLength(1);
    expect(res.body.unfilledSlots[0].blockedBy).toEqual({ MIN_REST: 2, MAX_WEEKLY_HOURS: 1 });
  });

  it('publishes a draft, and shows it to workers afterwards', async () => {
    const created = await makeRoster();

    const published = await request(app)
      .post(`/api/v1/orgs/${orgId}/rosters/${created.body.roster.id}/publish`)
      .set(auth(ownerToken));
    expect(published.body.roster.status).toBe('published');

    const asWorker = await request(app)
      .get(`/api/v1/orgs/${orgId}/rosters`)
      .set(auth(workerToken));
    expect(asWorker.body.rosters).toHaveLength(1);
  });

  it('refuses to publish twice', async () => {
    const created = await makeRoster();
    const url = `/api/v1/orgs/${orgId}/rosters/${created.body.roster.id}/publish`;

    await request(app).post(url).set(auth(ownerToken));
    const second = await request(app).post(url).set(auth(ownerToken));

    expect(second.status).toBe(409);
  });
});
