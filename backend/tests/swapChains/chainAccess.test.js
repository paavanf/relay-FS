// chainAccess.test.js
// Who may act on a swap chain, through the API - each refusal checked to
// have changed nothing:
//
//   a worker cannot accept someone else's leg - outside the chain they
//   cannot even see it, and inside it the leg is always their own
//   a worker cannot approve, reject or see the approval preview, even of a
//   swap they are in
//   an offer in a proposal is listed as matched, to those who may see it
//   only the proposer can cancel

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { SwapChain } from '../../src/models/index.js';
import { auth } from '../helpers/orgBuilder.js';
import { chainWorld, chainApi, wrenProposes } from './chainWorld.js';
import { snapshot, expectInvariants } from './chainInvariants.js';

let app;
let world;
let api;
let before;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(stopTestDb);

beforeEach(async () => {
  await clearTestDb();
  world = await chainWorld(app);
  api = chainApi(app, world);
  before = await snapshot();
});

const legsAccepted = async (chainId) => (await SwapChain.findById(chainId).lean()).legs.map((leg) => Boolean(leg.acceptedAt));

describe('who may act on a swap chain', () => {
  it("a worker cannot accept someone else's leg", async () => {
    const chain = await wrenProposes(api, world, world.people.sam);

    // Tess is not in it: to her it does not exist.
    expect((await api.act(world.people.tess, chain.id, 'accept')).status).toBe(404);
    expect((await api.show(world.people.tess, chain.id)).status).toBe(404);
    // Wren is in it, and cannot name someone else's leg to accept for them.
    expect((await api.act(world.people.wren, chain.id, 'accept', { membershipId: world.people.sam.membershipId })).status).toBe(422);
    expect(await legsAccepted(chain.id)).toEqual([true, false]);

    // Sam's acceptance marks Sam's leg and nobody else's.
    await api.act(world.people.sam, chain.id, 'accept');
    expect(await legsAccepted(chain.id)).toEqual([true, true]);
    await expectInvariants(before);
  });

  it('a worker cannot approve, reject or preview a swap - even one they are in', async () => {
    const chain = await wrenProposes(api, world, world.people.sam);
    await api.act(world.people.sam, chain.id, 'accept');

    expect((await api.act(world.people.sam, chain.id, 'approve')).status).toBe(403);
    expect((await api.act(world.people.wren, chain.id, 'reject')).status).toBe(403);
    expect((await api.impact(world.people.wren, chain.id)).status).toBe(403);
    expect((await SwapChain.findById(chain.id).lean()).status).toBe('awaiting_approval');
    await expectInvariants(before);
  });

  it('lists an offer in a proposal as matched - to its owner, and to managers', async () => {
    await wrenProposes(api, world, world.people.sam);
    const listFor = async (person) =>
      (await request(app).get(`/api/v1/orgs/${world.orgId}/swap-requests`).set(auth(person.token))).body.swapRequests.map((r) => r.status);

    expect(await listFor(world.people.sam)).toEqual(['matched']);
    expect(await listFor(world.people.tess)).toEqual(['open']);
    expect((await listFor(world.manager)).sort()).toEqual(['matched', 'matched', 'open']);
  });

  it('only the proposer can cancel', async () => {
    const chain = await wrenProposes(api, world, world.people.sam);

    const res = await api.act(world.people.sam, chain.id, 'cancel');
    expect([res.status, res.body.error.details.reason]).toEqual([403, 'NOT_PROPOSER']);
    expect((await api.act(world.people.wren, chain.id, 'cancel')).body.chain.status).toBe('cancelled');
    await expectInvariants(before);
  });
});
