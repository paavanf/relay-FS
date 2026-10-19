// chainRaces.test.js
// Swap chains under requests that arrive at the same moment (Promise.all):
//
//   1. two proposals racing for the same shift: exactly one wins, the other
//      gets 409
//   2. two people making the final acceptance at the same moment: exactly
//      one commit, and both requests succeed
//   3. a manager's approval sent twice at once: one commit, both succeed
//
// Each race runs several times from a fresh world - one round can happen
// not to interleave - and the invariants are checked after every round.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Assignment, SwapChain } from '../../src/models/index.js';
import { chainWorld, chainApi, optionKey, wrenProposes } from './chainWorld.js';
import { snapshot, expectInvariants, expectCommittedOnce } from './chainInvariants.js';

const ROUNDS = 4;
let app;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(stopTestDb);

async function freshWorld(options) {
  await clearTestDb();
  const world = await chainWorld(app, options);
  return { world, api: chainApi(app, world), before: await snapshot() };
}

describe('swap chains under simultaneous requests', () => {
  it('1. two proposals racing for the same shift: exactly one succeeds, the other gets 409', async () => {
    for (let round = 0; round < ROUNDS; round += 1) {
      const { world, api, before } = await freshWorld();
      const { wren, sam, tess } = world.people;
      const wrensKey = await optionKey(api, wren, world.offers.wren.requestId, sam);
      const tesssKey = await optionKey(api, tess, world.offers.tess.requestId, sam);

      const results = await Promise.all([
        api.propose(wren, world.offers.wren.requestId, wrensKey),
        api.propose(tess, world.offers.tess.requestId, tesssKey),
      ]);

      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(await SwapChain.countDocuments()).toBe(1);
      const winner = results.find((r) => r.status === 201).body.chain;
      const samsShift = await Assignment.findById(world.offers.sam.assignmentId).lean();
      expect(String(samsShift.reservedByChainId)).toBe(winner.id);
      await expectInvariants(before);
    }
  });

  it('1b. the same proposal sent twice at once: one chain, one 409', async () => {
    for (let round = 0; round < ROUNDS; round += 1) {
      const { world, api, before } = await freshWorld();
      const key = await optionKey(api, world.people.wren, world.offers.wren.requestId);
      const send = () => api.propose(world.people.wren, world.offers.wren.requestId, key);

      const results = await Promise.all([send(), send()]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(await SwapChain.countDocuments()).toBe(1);
      await expectInvariants(before);
    }
  });

  it('2. two people making the final acceptance at the same moment: exactly one commit', async () => {
    for (let round = 0; round < ROUNDS; round += 1) {
      const { world, api, before } = await freshWorld({ requireApproval: false });
      const chain = await wrenProposes(api, world);

      const results = await Promise.all([api.act(world.people.sam, chain.id, 'accept'), api.act(world.people.tess, chain.id, 'accept')]);

      expect(results.map((r) => r.status)).toEqual([200, 200]);
      await expectCommittedOnce(chain.id);
      await expectInvariants(before);
    }
  });

  it('3. a duplicate approval: one commit, and both requests succeed', async () => {
    for (let round = 0; round < ROUNDS; round += 1) {
      const { world, api, before } = await freshWorld();
      const chain = await wrenProposes(api, world, world.people.sam);
      await api.act(world.people.sam, chain.id, 'accept');

      const results = await Promise.all([api.act(world.manager, chain.id, 'approve'), api.act(world.owner, chain.id, 'approve')]);
      expect(results.map((r) => [r.status, r.body.chain?.status])).toEqual([[200, 'committed'], [200, 'committed']]);

      const again = await api.act(world.manager, chain.id, 'approve');
      expect([again.status, again.body.chain.status]).toEqual([200, 'committed']);
      await expectCommittedOnce(chain.id);
      await expectInvariants(before);
    }
  });
});
