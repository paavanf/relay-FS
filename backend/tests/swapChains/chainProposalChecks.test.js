// chainProposalChecks.test.js
// What a proposal is checked against on the server:
//
//   a shift saved before roles were recorded cannot be proposed or offered,
//   and never turns up in anyone's options
//   an option that is no longer among the answers is refused - the
//   client's chain is never trusted
//   an offer in a proposal cannot be withdrawn, changed or offered again
//   until the proposal ends

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Assignment, SwapChain, SwapRequest } from '../../src/models/index.js';
import { auth } from '../helpers/orgBuilder.js';
import { offerShift } from '../swaps/swapWorld.js';
import { chainWorld, chainApi, optionKey, wrenProposes } from './chainWorld.js';
import { snapshot, expectInvariants } from './chainInvariants.js';

const ROLELESS = "This shift was created before roles were recorded, so it can't be swapped. Shifts on rosters generated since then can be.";

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

// An offer as one made before Milestone 8 would be: a role-less shift, already on offer.
async function legacyOffer(person, days) {
  const assignmentId = await world.shift(world.published, person.membershipId, days, { roleless: true });
  const { startsAt } = await Assignment.findById(assignmentId).lean();
  const offer = await SwapRequest.create({ orgId: world.orgId, membershipId: person.membershipId, assignmentId, rosterId: world.published._id, startsAt });
  return { requestId: String(offer._id), assignmentId };
}

describe('shifts saved before roles were recorded', () => {
  it('cannot be proposed, and the reason says so', async () => {
    const legacy = await legacyOffer(world.people.wren, 11);
    const key = await optionKey(api, world.people.wren, world.offers.wren.requestId, world.people.sam);

    const proposed = await api.propose(world.people.wren, legacy.requestId, key);
    expect([proposed.status, proposed.body.error.message]).toEqual([409, ROLELESS]);
    const looked = await api.options(world.people.wren, legacy.requestId);
    expect([looked.status, looked.body.error.message]).toEqual([409, ROLELESS]);
    expect(await SwapChain.countDocuments()).toBe(0);
  });

  it("stay out of everyone else's options, and cannot be offered", async () => {
    const legacy = await legacyOffer(world.people.wren, 11);
    const sams = await api.options(world.people.sam, world.offers.sam.requestId);
    const shiftsOffered = [...sams.body.direct, ...sams.body.chains].flatMap((o) => o.legs.map((leg) => leg.assignment.id));
    expect(shiftsOffered).toContain(world.offers.wren.assignmentId);
    expect(shiftsOffered).not.toContain(legacy.assignmentId);

    const another = await world.shift(world.published, world.people.sam.membershipId, 12, { roleless: true });
    const offered = await offerShift(app, world.orgId, world.people.sam.token, another);
    expect([offered.status, offered.body.error.message]).toEqual([409, ROLELESS]);
  });
});

describe('a proposal is checked again on the server', () => {
  it('refuses an option that is no longer among the answers', async () => {
    const key = await optionKey(api, world.people.wren, world.offers.wren.requestId, world.people.sam);
    const tesssKey = await optionKey(api, world.people.tess, world.offers.tess.requestId, world.people.sam);
    expect((await api.propose(world.people.tess, world.offers.tess.requestId, tesssKey)).status).toBe(201);

    const res = await api.propose(world.people.wren, world.offers.wren.requestId, key);
    expect([res.status, res.body.error.message]).toEqual([409, 'These options have changed — search again.']);
    expect(await SwapChain.countDocuments()).toBe(1);
    await expectInvariants(before);
  });

  it('keeps an offer in a proposal from being withdrawn, changed or offered again', async () => {
    await wrenProposes(api, world, world.people.sam);
    const url = `/api/v1/orgs/${world.orgId}/swap-requests/${world.offers.sam.requestId}`;

    const withdrawn = await request(app).delete(url).set(auth(world.people.sam.token));
    expect([withdrawn.status, withdrawn.body.error.message]).toEqual([409, 'This shift is part of a swap proposal. Decline or cancel the proposal first.']);
    expect((await request(app).patch(url).set(auth(world.people.sam.token)).send({ note: 'Changed my mind' })).status).toBe(409);
    expect((await offerShift(app, world.orgId, world.people.sam.token, world.offers.sam.assignmentId)).status).toBe(409);
    await expectInvariants(before);
  });
});
