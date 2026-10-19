// chainFlow.test.js
// A swap from proposal to the end, through the API, and everything it
// leaves behind:
//
//   proposed, accepted, approved: the shifts change hands, the offers are
//   fulfilled, the fairness ledger is recomputed, and the audit log and
//   notifications tell the story in order
//   declined or rejected: it ends at once, the shifts are let go and the
//   offers open again, and the others are told why
//   while it waits, the people in it see where everyone stands, and the
//   sidebar counts what is waiting for each of them

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { AuditLog, FairnessLedger, Notification, SwapRequest } from '../../src/models/index.js';
import { auth } from '../helpers/orgBuilder.js';
import { chainWorld, chainApi, wrenProposes } from './chainWorld.js';
import { snapshot, expectInvariants, holdersNow, expectNothingChanged, expectCommittedOnce } from './chainInvariants.js';

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

const typesFor = async (person) => (await Notification.find({ membershipId: person.membershipId }).sort({ _id: 1 }).lean()).map((n) => n.type);
const summaryFor = async (person) => (await request(app).get(`/api/v1/orgs/${world.orgId}/swap-chains/summary`).set(auth(person.token))).body;

describe('a swap from proposal to the end', () => {
  it('proposed, accepted and approved: the shifts change hands, and the record says how', async () => {
    const chain = await wrenProposes(api, world, world.people.sam);
    expect(chain).toMatchObject({ status: 'proposed', size: 2, youProposed: true, waitingForYou: false });
    expect(chain.participants.map((p) => p.state)).toEqual(['accepted', 'waiting']);

    const samSees = (await api.show(world.people.sam, chain.id)).body.chain;
    expect(samSees).toMatchObject({ waitingForYou: true, youAreIn: true });
    expect(await summaryFor(world.people.sam)).toEqual({ waitingForYou: 1, awaitingApproval: 0 });
    expect((await api.list(world.people.tess)).body.chains).toEqual([]);

    expect((await api.act(world.people.sam, chain.id, 'accept')).body.chain.status).toBe('awaiting_approval');
    expect(await summaryFor(world.manager)).toEqual({ waitingForYou: 0, awaitingApproval: 1 });

    const done = await api.act(world.manager, chain.id, 'approve');
    expect([done.status, done.body.chain.status]).toEqual([200, 'committed']);
    await expectCommittedOnce(chain.id);
    expect(await SwapRequest.countDocuments({ status: 'fulfilled' })).toBe(2);
    expect(await FairnessLedger.countDocuments({ orgId: world.orgId })).toBeGreaterThan(0);

    const actions = (await AuditLog.find({ chainId: chain.id }).sort({ _id: 1 }).lean()).map((entry) => entry.action);
    expect(actions).toEqual(['swap.proposed', 'swap.accepted', 'swap.awaiting_approval', 'shift.transferred', 'shift.transferred', 'swap.approved', 'swap.committed']);
    expect(await typesFor(world.people.sam)).toEqual(['swap_proposed', 'swap_awaiting_approval', 'swap_approved', 'swap_committed']);
    expect(await typesFor(world.manager)).toEqual(['swap_awaiting_approval']);
    await expectInvariants(before);
  });

  it('declined: it ends at once, the shifts are let go, and the others are told', async () => {
    const holders = await holdersNow();
    const chain = await wrenProposes(api, world);

    const res = await api.act(world.people.tess, chain.id, 'decline');

    expect(res.body.chain).toMatchObject({ status: 'declined', endedBy: { action: 'decline', by: { name: 'Tess Third' } } });
    expect(res.body.chain.participants.map((p) => p.state)).toEqual(['accepted', 'waiting', 'declined']);
    await expectNothingChanged(chain.id, 'declined', holders, 3);
    const told = await Notification.find({ chainId: chain.id, type: 'swap_declined' }).lean();
    expect(told.map((n) => String(n.membershipId)).sort()).toEqual([world.people.wren.membershipId, world.people.sam.membershipId].sort());
    expect(told[0].message).toBe('Tess Third declined the swap, so it is off. Your offer is open again.');
    await expectInvariants(before);
  });

  it("rejected by a manager: it ends, and the manager's reason reaches everyone in it", async () => {
    const holders = await holdersNow();
    const chain = await wrenProposes(api, world, world.people.sam);
    await api.act(world.people.sam, chain.id, 'accept');

    const res = await api.act(world.manager, chain.id, 'reject', { reason: 'We need Sam on days that week.' });

    expect(res.body.chain).toMatchObject({ status: 'declined', rejectionReason: 'We need Sam on days that week.', endedBy: { action: 'reject' } });
    await expectNothingChanged(chain.id, 'declined', holders, 3);
    const told = await Notification.find({ chainId: chain.id, type: 'swap_rejected' }).lean();
    expect(told).toHaveLength(2);
    expect(told[0].message).toBe('A manager rejected the swap: We need Sam on days that week. Your offer is open again.');
    await expectInvariants(before);
  });
});
