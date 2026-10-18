// seedDemoSwaps.test.js
// The demo seed's swap requests, read through the real options service,
// against the in-memory server - never a real database. The seed promises
// three kinds of answer, and each must be there:
//
//   a request only a three-person chain resolves (no direct swap)
//   a request with a direct swap
//   a request with no options, and a reason anyone can follow
//
// "Now" is put at the seed's anchor week, before any requested shift starts,
// since the test anchor is a fixed date that is long past.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { startTestServer, stopTestDb } from '../helpers/db.js';
import { seed, inDatabase, DEMO_ANCHOR } from '../helpers/demoSeed.js';
import { DEMO_ORG_ID } from '../../scripts/demo/ids.js';
import { Membership, SwapRequest } from '../../src/models/index.js';
import { getSwapOptions } from '../../src/services/swap/index.js';

const SLOW = 120_000;
let answers;

beforeAll(async () => {
  await startTestServer();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  expect(await seed(['--yes'])).toBe(0);
  vi.restoreAllMocks();

  answers = await inDatabase('relay-demo', async () => {
    const manager = await Membership.findOne({ orgId: DEMO_ORG_ID, role: 'manager' }).lean();
    const requests = await SwapRequest.find({ orgId: DEMO_ORG_ID, status: 'open' }).sort({ _id: 1 }).lean();
    const now = new Date(`${DEMO_ANCHOR}T00:00:00Z`);
    const found = [];
    for (const r of requests) found.push(await getSwapOptions({ orgId: DEMO_ORG_ID, membership: manager, requestId: r._id, now }));
    return found;
  });
}, SLOW);

afterAll(async () => {
  await stopTestDb();
});

describe("the demo seed's swap requests", () => {
  it('include one that only a three-person chain resolves', () => {
    const chainOnly = answers.find((a) => a.direct.length === 0 && a.chains[0]?.size === 3);
    const people = chainOnly.chains[0].legs.map((leg) => leg.to.name);

    expect(new Set(people).size).toBe(3);
    expect(people).toContain(chainOnly.request.requester.name);
  });

  it('include one with a direct swap', () => {
    expect(answers.find((a) => a.direct.length > 0).direct[0].size).toBe(2);
  });

  it('include one with no options, and say why in plain words', () => {
    const none = answers.find((a) => a.direct.length + a.chains.length === 0);

    expect(none.request.requester.name).toBe('Grace Kim');
    expect(none.noMatch.summary).toMatch(/^\d+ offers checked: \d+ are on days you marked unavailable\.$/);
  });
});
