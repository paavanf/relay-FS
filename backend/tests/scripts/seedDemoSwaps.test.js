// seedDemoSwaps.test.js
// The demo seed's roles and swap requests, read through the real services,
// against the in-memory server - never a real database. The seed promises:
//
//   every assignment records the role it fills
//   a request only a three-person chain resolves - and only because its
//     owner said what they would take: clear that, and a direct swap appears
//   a request with a direct swap
//   Grace's request, with no options because of the days she cannot work
//   a charge nurse's shift with no options, because nobody else offering
//     holds the role - and the explanation says so
//
// "Now" is put at the seed's anchor week, before any requested shift starts,
// since the test anchor is a fixed date that is long past.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { startTestServer, stopTestDb } from '../helpers/db.js';
import { seed, inDatabase, DEMO_ANCHOR } from '../helpers/demoSeed.js';
import { DEMO_ORG_ID } from '../../scripts/demo/ids.js';
import { qualificationIdOf } from '../../scripts/demo/wardDocs.js';
import { Membership, SwapRequest, Assignment } from '../../src/models/index.js';
import { getSwapOptions, updateSwapRequest } from '../../src/services/swap/index.js';

const SLOW = 120_000;
const now = new Date(`${DEMO_ANCHOR}T00:00:00Z`);
const optionsOf = (request) =>
  inDatabase('relay-demo', async () => {
    const manager = await Membership.findOne({ orgId: DEMO_ORG_ID, role: 'manager' }).lean();
    return getSwapOptions({ orgId: DEMO_ORG_ID, membership: manager, requestId: request._id, now });
  });

let requests;
let answers;

beforeAll(async () => {
  await startTestServer();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  expect(await seed(['--yes'])).toBe(0);
  vi.restoreAllMocks();

  requests = await inDatabase('relay-demo', () => SwapRequest.find({ orgId: DEMO_ORG_ID, status: 'open' }).sort({ _id: 1 }).lean());
  answers = [];
  for (const request of requests) answers.push(await optionsOf(request));
}, SLOW);

afterAll(async () => {
  await stopTestDb();
});

const found = (a) => a.direct.length + a.chains.length > 0;

describe("the demo seed's roles and swap requests", () => {
  it('gives every assignment the role it fills', async () => {
    expect(await inDatabase('relay-demo', () => Assignment.countDocuments({ orgId: DEMO_ORG_ID, slotQualificationId: null }))).toBe(0);
  });

  it("includes a request a filter leaves to a three-person chain, which a direct swap resolves once it is cleared", async () => {
    const i = requests.findIndex((r) => r.acceptableShiftFilters.categories.length > 0);
    expect(answers[i].direct).toEqual([]);
    expect(answers[i].chains[0].size).toBe(3);

    await inDatabase('relay-demo', async () => {
      const owner = await Membership.findById(requests[i].membershipId).lean();
      await updateSwapRequest({ orgId: DEMO_ORG_ID, membership: owner, requestId: requests[i]._id, acceptableShiftFilters: {}, now });
    });
    expect((await optionsOf(requests[i])).direct.length).toBeGreaterThan(0);
  }, SLOW);

  it('includes a request with a direct swap', () => {
    expect(answers.some((a) => a.direct.length > 0 && a.request.acceptableShiftFilters.categories.length === 0)).toBe(true);
  });

  it("includes Grace's request, which nothing resolves because of the days she cannot work", () => {
    const grace = answers.find((a) => a.request.requester.name === 'Grace Kim');
    expect(found(grace)).toBe(false);
    expect(grace.noMatch.summary).toMatch(/are on days you marked unavailable/);
  });

  it('includes a charge nurse shift nobody else offering could take, and says so', async () => {
    const i = answers.findIndex((a) => !found(a) && /without the qualification your shift needs/.test(a.noMatch.summary));
    const shift = await inDatabase('relay-demo', () => Assignment.findById(requests[i].assignmentId).lean());

    expect(String(shift.slotQualificationId)).toBe(String(qualificationIdOf('cn')));
    expect(answers[i].noMatch.reasons).toEqual([{ side: 'them', code: 'QUALIFICATION_MISMATCH', count: answers[i].noMatch.offersChecked }]);
  });
});
