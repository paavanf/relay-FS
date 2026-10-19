// seedDemoProposals.test.js
// The demo seed's two proposed swaps (Milestone 8), read back from the
// in-memory server - never a real database:
//
//   one waiting for its second person to accept, one everyone has accepted
//   and a manager has still to approve - so every state can be seen
//   each holds its own shifts, and only those, until its deadline
//   their offers are matched, which keeps them out of every search: the
//   swap cases (seedDemoSwaps.test.js) still answer as proven
//
// "Now" is the seed's anchor week, as in the other seed tests.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { startTestServer, stopTestDb } from '../helpers/db.js';
import { seed, inDatabase, DEMO_ANCHOR } from '../helpers/demoSeed.js';
import { DEMO_ORG_ID } from '../../scripts/demo/ids.js';
import { SwapRequest, Assignment, SwapChain } from '../../src/models/index.js';

const now = new Date(`${DEMO_ANCHOR}T00:00:00Z`);
let stored;

beforeAll(async () => {
  await startTestServer();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  expect(await seed(['--yes'])).toBe(0);
  vi.restoreAllMocks();

  stored = await inDatabase('relay-demo', async () => ({
    chains: await SwapChain.find({ orgId: DEMO_ORG_ID }).sort({ status: 1 }).lean(),
    reserved: await Assignment.find({ orgId: DEMO_ORG_ID, reservedByChainId: { $ne: null } }).lean(),
    requests: await SwapRequest.find({ orgId: DEMO_ORG_ID }).lean(),
  }));
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

describe("the demo seed's proposed swaps", () => {
  it('include one waiting for acceptance and one waiting for approval', () => {
    expect(stored.chains.map((c) => [c.status, c.legs.filter((leg) => !leg.acceptedAt).length])).toEqual([
      ['awaiting_approval', 0],
      ['proposed', 1],
    ]);
    expect(stored.chains.every((c) => c.expiresAt > now && c.requiresApproval)).toBe(true);
  });

  it('each hold their own shifts, and only those', () => {
    const held = stored.chains.flatMap((c) => c.legs.map((leg) => `${leg.givesAssignmentId} ${c._id}`));
    expect(stored.reserved.map((a) => `${a._id} ${a.reservedByChainId}`).sort()).toEqual(held.sort());
    expect(new Set(held.map((entry) => entry.split(' ')[0])).size).toBe(4);
  });

  it('take their offers out of every search, and leave the cases open', () => {
    const matched = stored.requests.filter((r) => r.status === 'matched');
    expect(matched.map((r) => String(r.chainId)).sort()).toEqual(stored.chains.flatMap((c) => [c._id, c._id].map(String)).sort());
    expect(stored.requests.filter((r) => r.status === 'open')).toHaveLength(6);
  });
});
