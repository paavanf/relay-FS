// swapOptionsQueries.test.js
// The database work behind one swap search (GET .../options), and proof
// that running its independent queries side by side changed nothing in what
// the search answers.
//
// optionsAnswer.json is the whole answer for Wren's offer in the chain world
// - every option, hand-over, score and key, the request as described, and
// the search's counts - written by the code as it was before its queries
// ran side by side (readableAnswer.js makes it the same on every run). The
// refusals are checked in the same order as before, too.
//
// The rounds (helpers/queryRounds.js) are how many times the request waits
// on the database one after another: 18 before, 11 now, for the same 23
// queries. A new query here, or one more wait, should be a decision, not an
// accident.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'node:fs';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { queryRounds } from '../helpers/queryRounds.js';
import { createApp } from '../../src/app.js';
import { Assignment, Membership } from '../../src/models/index.js';
import { MEMBERSHIP_STATUS } from '../../src/config/constants.js';
import { ROLELESS_SHIFT } from '../../src/services/swap/optionKey.js';
import { chainWorld, chainApi } from '../swapChains/chainWorld.js';
import { readableAnswer } from './readableAnswer.js';

const BEFORE = JSON.parse(fs.readFileSync(new URL('./optionsAnswer.json', import.meta.url), 'utf8'));

let app;
let world;
let api;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  world = await chainWorld(app);
  api = chainApi(app, world);
});

const wrensOptions = (person = world.people.wren) => api.options(person, world.offers.wren.requestId);

describe('the queries behind a swap search', () => {
  it('answers Wren exactly as before: two direct swaps and two three-person chains', async () => {
    const res = await wrensOptions();
    expect(res.status).toBe(200);
    expect(await readableAnswer(res.body, world)).toEqual(BEFORE);
  });

  it('answers a manager the same, except that the offer is not theirs', async () => {
    const res = await wrensOptions(world.manager);
    expect(res.status).toBe(200);
    expect(await readableAnswer(res.body, world)).toEqual({ ...BEFORE, request: { ...BEFORE.request, mine: false } });
  });

  it('refuses in the same order: an offer left by someone off the team is not found, before its shift is judged', async () => {
    const wren = { _id: world.people.wren.membershipId };
    await Assignment.updateOne({ _id: world.offers.wren.assignmentId }, { $set: { slotQualificationId: null } });
    await Membership.updateOne(wren, { $set: { status: MEMBERSHIP_STATUS.INACTIVE } });
    const gone = await wrensOptions(world.manager);
    expect([gone.status, gone.body.error.message]).toEqual([404, 'Swap request not found']);

    await Membership.updateOne(wren, { $set: { status: MEMBERSHIP_STATUS.ACTIVE } });
    const back = await wrensOptions(world.manager);
    expect([back.status, back.body.error.message]).toEqual([409, ROLELESS_SHIFT]);
  });

  it('makes 23 queries, in 11 rounds', async () => {
    const { result, rounds } = await queryRounds(wrensOptions);
    expect(result.status).toBe(200);
    expect(rounds).toEqual([
      ['User.findOne'], // who is asking (authenticate)
      ['Membership.findOne'], // their membership here (resolveMembership)
      ['SwapChain.find'], // proposals whose time has run out, expired before anything is read
      ['SwapRequest.findOne'], // the offer
      ['Assignment.findOne', 'Membership.findOne'], // its shift's role; whether its owner is still on the team
      ['Organisation.findOne', 'SwapRequest.find'], // the organisation; every open offer
      // the team, templates, coverage, availability and roles; the offered shifts
      ['Assignment.find', 'Availability.find', 'CoverageRequirement.find', 'Membership.find', 'Qualification.find', 'ShiftTemplate.find'],
      ['FairnessLedger.find', 'Roster.find'], // the fairness ledger; the published rosters
      ['Assignment.find'], // every published shift around the offers
      ['Assignment.find', 'Membership.find', 'Membership.find'], // names in the options; the offer's shift; its owner
      ['ShiftTemplate.find', 'User.find', 'User.find'],
    ]);
    expect(rounds.flat()).toHaveLength(23);
  });
});
