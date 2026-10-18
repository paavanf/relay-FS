// swapOptions.test.js
// GET /swap-requests/:id/options - the swap chain finder through the API.
//
// Pinned hardest: looking at options writes nothing at all (every
// collection counted before and after), and nobody but the requester or a
// manager can look.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Assignment, SwapRequest } from '../../src/models/index.js';
import { auth } from '../helpers/orgBuilder.js';
import { swapWorld, offerShift } from './swapWorld.js';

let app;
let world;

const optionsOf = (requestId, token) =>
  request(app).get(`/api/v1/orgs/${world.orgId}/swap-requests/${requestId}/options`).set(auth(token));

const offer = async (person, days) =>
  (await offerShift(app, world.orgId, person.token, await world.shift(world.published, person.membershipId, days))).body.swapRequest.id;

// Every collection's document count, to prove a request wrote nothing.
const everyCount = async () =>
  Object.fromEntries(await Promise.all(Object.entries(mongoose.connection.collections).map(async ([name, c]) => [name, await c.countDocuments()])));

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  world = await swapWorld(app);
});

describe('swap options', () => {
  it('explains, rather than fails, when nobody else has offered anything', async () => {
    const res = await optionsOf(await offer(world.worker, 5), world.worker.token);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ direct: [], chains: [], noMatch: { offersChecked: 0 } });
    expect(res.body.noMatch.summary).toBe('Nobody else has offered a shift yet, so there is nothing to swap with.');
  });

  it('finds a direct swap and names only the two people in it', async () => {
    const wrens = await offer(world.worker, 5);
    await offer(world.sam, 7);
    const res = await optionsOf(wrens, world.worker.token);

    expect(res.body.request.mine).toBe(true);
    expect(res.body.direct).toHaveLength(1);
    const handOvers = res.body.direct[0].legs.map((leg) => `${leg.from.name} -> ${leg.to.name}`);
    expect(handOvers).toEqual(['Sam Second -> Wren Worker', 'Wren Worker -> Sam Second']);
    expect(res.text).not.toContain('Olive Owner');
    expect(res.text).not.toContain('Mo Manager');
  });

  it('changes nothing in the database', async () => {
    const wrens = await offer(world.worker, 5);
    await offer(world.sam, 7);
    const before = await everyCount();

    expect((await optionsOf(wrens, world.worker.token)).status).toBe(200);
    expect((await optionsOf(wrens, world.manager.token)).status).toBe(200);

    expect(await everyCount()).toEqual(before);
  });

  it("lets the requester and managers look, but not another worker", async () => {
    const wrens = await offer(world.worker, 5);
    expect((await optionsOf(wrens, world.manager.token)).status).toBe(200);
    expect((await optionsOf(wrens, world.sam.token)).status).toBe(404);
  });

  it('leaves expired offers out of the search, and refuses options for one', async () => {
    const wrens = await offer(world.worker, 5);
    const sams = await offer(world.sam, 7);

    // Sam's shift starts: from now on that offer is expired wherever it is read.
    const started = new Date(Date.now() - 60_000);
    const samsRequest = await SwapRequest.findById(sams);
    await Assignment.updateOne({ _id: samsRequest.assignmentId }, { $set: { startsAt: started } });
    await SwapRequest.updateOne({ _id: sams }, { $set: { startsAt: started } });

    const res = await optionsOf(wrens, world.worker.token);
    expect(res.body.stats.offersConsidered).toBe(0);
    expect(res.body.direct).toEqual([]);
    expect((await optionsOf(sams, world.sam.token)).status).toBe(409);
  });
});
