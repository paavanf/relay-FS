// swapRequests.test.js
// Offering a shift, listing offers and withdrawing one. Only your own,
// published, future shift can be offered, once; expired offers drop out of
// every list by themselves.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { SwapRequest, Assignment } from '../../src/models/index.js';
import { auth } from '../helpers/orgBuilder.js';
import { swapWorld, offerShift, dateFromToday } from './swapWorld.js';

let app;
let world;

const list = (token) => request(app).get(`/api/v1/orgs/${world.orgId}/swap-requests`).set(auth(token));

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

describe('swap requests', () => {
  it('accepts your own future shift on a published roster, with a note', async () => {
    const mine = await world.shift(world.published, world.worker.membershipId, 5);
    const res = await offerShift(app, world.orgId, world.worker.token, mine, 'Family wedding');

    expect(res.status).toBe(201);
    expect(res.body.swapRequest).toMatchObject({
      status: 'open',
      note: 'Family wedding',
      requester: { membershipId: world.worker.membershipId, name: 'Wren Worker' },
      mine: true,
      assignment: { id: mine, date: dateFromToday(5), shift: { name: 'Day', category: 'day' } },
    });
  });

  it("refuses someone else's shift, a draft shift and a shift that has started", async () => {
    const samsShift = await world.shift(world.published, world.sam.membershipId, 5);
    const draftShift = await world.shift(world.draft, world.worker.membershipId, 6);
    const pastShift = await world.shift(world.published, world.worker.membershipId, -2);

    expect((await offerShift(app, world.orgId, world.worker.token, samsShift)).status).toBe(403);
    expect((await offerShift(app, world.orgId, world.worker.token, draftShift)).status).toBe(409);
    expect((await offerShift(app, world.orgId, world.worker.token, pastShift)).status).toBe(409);
    expect(await SwapRequest.countDocuments()).toBe(0);
  });

  it('refuses offering the same shift twice', async () => {
    const mine = await world.shift(world.published, world.worker.membershipId, 5);
    expect((await offerShift(app, world.orgId, world.worker.token, mine)).status).toBe(201);

    const again = await offerShift(app, world.orgId, world.worker.token, mine);
    expect(again.status).toBe(409);
    expect(again.body.error.message).toBe('You have already offered this shift.');
  });

  it('shows a worker their own offers and a manager everyone’s', async () => {
    await offerShift(app, world.orgId, world.worker.token, await world.shift(world.published, world.worker.membershipId, 5));
    await offerShift(app, world.orgId, world.sam.token, await world.shift(world.published, world.sam.membershipId, 6));

    expect((await list(world.worker.token)).body.swapRequests.map((r) => r.requester.name)).toEqual(['Wren Worker']);
    const seenByManager = (await list(world.manager.token)).body.swapRequests;
    expect(seenByManager.map((r) => [r.requester.name, r.mine])).toEqual([['Wren Worker', false], ['Sam Second', false]]);
  });

  it('drops an offer from every list once its shift has started', async () => {
    const mine = await world.shift(world.published, world.worker.membershipId, 5);
    const offer = await offerShift(app, world.orgId, world.worker.token, mine);

    // Time passes: the shift is now under way.
    const started = new Date(Date.now() - 60_000);
    await Assignment.updateOne({ _id: mine }, { $set: { startsAt: started } });
    await SwapRequest.updateOne({ _id: offer.body.swapRequest.id }, { $set: { startsAt: started } });

    expect((await list(world.worker.token)).body.swapRequests).toEqual([]);
    expect((await list(world.manager.token)).body.swapRequests).toEqual([]);
  });

  it('lets only the person who offered a shift withdraw it', async () => {
    const offer = await offerShift(app, world.orgId, world.worker.token, await world.shift(world.published, world.worker.membershipId, 5));
    const url = `/api/v1/orgs/${world.orgId}/swap-requests/${offer.body.swapRequest.id}`;

    expect((await request(app).delete(url).set(auth(world.manager.token))).status).toBe(403);
    expect((await request(app).delete(url).set(auth(world.worker.token))).status).toBe(204);
    expect((await list(world.worker.token)).body.swapRequests).toEqual([]);
    expect((await SwapRequest.findById(offer.body.swapRequest.id)).status).toBe('cancelled');
  });
});
