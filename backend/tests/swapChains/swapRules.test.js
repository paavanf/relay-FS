// swapRules.test.js
// An organisation's swap rules (GET/PUT /orgs/:orgId/swap-rules): everyone
// can read them, only managers and owners change them, every rule is sent
// together and checked strictly - and a swap already proposed keeps the
// rules it was proposed under.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { auth } from '../helpers/orgBuilder.js';
import { offerShift } from '../swaps/swapWorld.js';
import { chainWorld, chainApi, optionKey, wrenProposes } from './chainWorld.js';

const VALID = { acceptanceWindowHours: 24, requireManagerApproval: false, maxChainLength: 3 };

let app;
let world;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);
afterAll(stopTestDb);

beforeEach(async () => {
  await clearTestDb();
  world = await chainWorld(app);
});

const url = () => `/api/v1/orgs/${world.orgId}/swap-rules`;
const save = (person, body) => request(app).put(url()).set(auth(person.token)).send(body);

describe('swap rules', () => {
  it('can be read by anyone in the organisation', async () => {
    const res = await request(app).get(url()).set(auth(world.people.wren.token));
    expect(res.body.swapRules).toEqual({ acceptanceWindowHours: 48, requireManagerApproval: true, maxChainLength: 4 });
  });

  it('can be changed by managers and owners only', async () => {
    expect((await save(world.people.wren, VALID)).status).toBe(403);
    const res = await save(world.manager, VALID);
    expect([res.status, res.body.swapRules]).toEqual([200, VALID]);
    expect((await request(app).get(url()).set(auth(world.people.sam.token))).body.swapRules).toEqual(VALID);
  });

  it.each([
    ['a window of no time', { ...VALID, acceptanceWindowHours: 0 }],
    ['a window over a week', { ...VALID, acceptanceWindowHours: 169 }],
    ['part of an hour', { ...VALID, acceptanceWindowHours: 1.5 }],
    ['a chain of one', { ...VALID, maxChainLength: 1 }],
    ['a chain of five', { ...VALID, maxChainLength: 5 }],
    ['approval as text', { ...VALID, requireManagerApproval: 'yes' }],
    ['a rule left out', { acceptanceWindowHours: 24, maxChainLength: 3 }],
    ['a rule nobody asked for', { ...VALID, autoApprove: true }],
  ])('refuses %s', async (_, body) => {
    expect((await save(world.manager, body)).status).toBe(422);
  });

  it('decides how new proposals work, and leaves those already made alone', async () => {
    const api = chainApi(app, world);
    const before = await wrenProposes(api, world, world.people.sam);
    expect(before.requiresApproval).toBe(true);

    await save(world.owner, VALID);
    await api.act(world.people.sam, before.id, 'accept');
    expect((await api.show(world.people.sam, before.id)).body.chain.status).toBe('awaiting_approval');

    const after = await tessProposes(api);
    expect(after.requiresApproval).toBe(false);
    expect(new Date(after.expiresAt) - new Date(after.createdAt)).toBeLessThanOrEqual(24 * 3_600_000 + 1_000);
  });
});

// A new proposal under the new rules: Wren offers another shift, and Tess proposes a direct swap for it.
async function tessProposes(api) {
  const another = await world.shift(world.published, world.people.wren.membershipId, 13);
  await offerShift(app, world.orgId, world.people.wren.token, another);
  const key = await optionKey(api, world.people.tess, world.offers.tess.requestId, world.people.wren);
  return (await api.propose(world.people.tess, world.offers.tess.requestId, key)).body.chain;
}
