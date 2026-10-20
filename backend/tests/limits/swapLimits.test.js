// swapLimits.test.js
// The two limits on swaps (config/constants.js):
//
//   proposals   one person proposes at most ten swaps an hour - counted from
//               the database, so cancelling one does not give it back
//   searches    one person runs the swap finder at most ten times a minute
//               (in memory, so switched on here for the test)

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestDb, stopTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { SwapChain } from '../../src/models/index.js';
import { limitsInTests } from '../../src/middleware/rateLimiters.js';
import { SWAP_PROPOSAL_LIMIT, SWAP_SEARCH_LIMIT } from '../../src/config/constants.js';
import { chainWorld, chainApi, optionKey } from '../swapChains/chainWorld.js';
import { expectLimited } from './limitAsserts.js';

let app;
let world;
let api;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
  world = await chainWorld(app);
  api = chainApi(app, world);
}, 120_000);
afterAll(stopTestDb);

// Proposals Wren made earlier this hour, already over: they count, and hold nothing.
async function earlierProposals(count) {
  const leg = { membershipId: world.people.wren.membershipId, swapRequestId: world.offers.wren.requestId, givesVersion: 0 };
  const ids = { givesAssignmentId: world.offers.wren.assignmentId, receivesAssignmentId: world.offers.sam.assignmentId };
  await SwapChain.insertMany(
    Array.from({ length: count }, () => ({
      orgId: world.orgId,
      proposerId: world.people.wren.membershipId,
      optionKey: 'earlier',
      status: 'cancelled',
      legs: [{ ...leg, ...ids }],
      requiresApproval: true,
      expiresAt: new Date(Date.now() + 86_400_000),
    })),
  );
}

describe('abuse limits on swaps', () => {
  it(`lets one person propose ${SWAP_PROPOSAL_LIMIT.max} swaps an hour - cancelling one does not give it back`, async () => {
    const { wren, sam } = world.people;
    await earlierProposals(SWAP_PROPOSAL_LIMIT.max - 1);
    const key = await optionKey(api, wren, world.offers.wren.requestId, sam);

    const tenth = await api.propose(wren, world.offers.wren.requestId, key);
    expect(tenth.status).toBe(201);
    expect((await api.act(wren, tenth.body.chain.id, 'cancel')).status).toBe(200);

    const eleventh = await api.propose(wren, world.offers.wren.requestId, key);
    expectLimited(eleventh, /^You have proposed 10 swaps in the last hour, the most anyone can in an hour\./);
  });

  it(`lets one person search for swap options ${SWAP_SEARCH_LIMIT.max} times a minute`, async () => {
    limitsInTests.on = true;
    try {
      for (let i = 0; i < SWAP_SEARCH_LIMIT.max; i += 1) {
        expect((await api.options(world.people.sam, world.offers.sam.requestId)).status).toBe(200);
      }
      expectLimited(await api.options(world.people.sam, world.offers.sam.requestId), /^Too many swap searches in the last minute\./);
      // Counted per person: someone else's searches are their own.
      expect((await api.options(world.people.tess, world.offers.tess.requestId)).status).toBe(200);
    } finally {
      limitsInTests.on = false;
    }
  });
});
