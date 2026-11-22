// doubleSubmit.test.js
// A double click that reaches the server: the same person's Accept sent twice
// at the same moment. Neither request fails, and the swap records one
// acceptance - one change of revision and one audit entry - however the two
// interleave. (Two proposals, two final acceptances and two approvals at
// once are chainRaces.test.js.)

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { AuditLog, SwapChain } from '../../src/models/index.js';
import { chainWorld, chainApi, wrenProposes } from './chainWorld.js';

const ROUNDS = 4;
let app;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

describe('the same request twice at once', () => {
  it("one person's Accept, sent twice: one acceptance, no error", async () => {
    for (let round = 0; round < ROUNDS; round += 1) {
      await clearTestDb();
      const world = await chainWorld(app);
      const api = chainApi(app, world);
      const chain = await wrenProposes(api, world);
      const before = await SwapChain.findById(chain.id).lean();
      const sam = world.people.sam;

      const results = await Promise.all([api.act(sam, chain.id, 'accept'), api.act(sam, chain.id, 'accept')]);

      expect(results.every((res) => res.status < 500)).toBe(true);
      expect(results.some((res) => res.status === 200)).toBe(true);
      const after = await SwapChain.findById(chain.id).lean();
      expect(after.revision).toBe(before.revision + 1);
      expect(after.legs.filter((leg) => leg.acceptedAt).length).toBe(before.legs.filter((leg) => leg.acceptedAt).length + 1);
      expect(await AuditLog.countDocuments({ chainId: chain.id, action: /accept/ })).toBe(1);
    }
  });
});
