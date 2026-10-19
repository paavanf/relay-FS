// chainCommitEdges.test.js
// The commit refusing at the last moment, and leaving nothing behind:
//   4. the deadline passes between the final acceptance and the approval:
//      refused, and every reservation released
//   5. someone in the swap is deactivated after accepting: the commit fails
//      cleanly, with a reason that names them
//   6. a shift's version changes after the proposal: the commit aborts and
//      no shift changes hands
// After each, every shift is where it started, the offers are open again,
// and the invariants (chainInvariants.js) hold.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Assignment, Notification, SwapChain } from '../../src/models/index.js';
import { auth } from '../helpers/orgBuilder.js';
import { chainWorld, chainApi, wrenProposes } from './chainWorld.js';
import { snapshot, expectInvariants, holdersNow, expectNothingChanged } from './chainInvariants.js';

const PAST = new Date(Date.now() - 60_000);
let app;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);
afterAll(stopTestDb);

async function setUp(options) {
  await clearTestDb();
  const world = await chainWorld(app, options);
  return { world, api: chainApi(app, world), before: await snapshot(), holders: await holdersNow() };
}

const expectUntouched = async ({ before, holders }, chainId, status) => {
  await expectNothingChanged(chainId, status, holders, 3);
  await expectInvariants(before);
};

describe('a commit refused at the last moment', () => {
  it('4. the deadline passing between the final acceptance and the approval: refused, reservations released', async () => {
    const setup = await setUp();
    const { world, api } = setup;
    const chain = await wrenProposes(api, world, world.people.sam);
    await api.act(world.people.sam, chain.id, 'accept');
    await SwapChain.updateOne({ _id: chain.id }, { $set: { expiresAt: PAST } });

    const res = await api.act(world.manager, chain.id, 'approve');

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ message: 'This swap proposal expired before it was completed.', details: { reason: 'EXPIRED' } });
    await expectUntouched(setup, chain.id, 'expired');
  });

  it('4b. the deadline passing before the last acceptance, with no approval needed: refused too', async () => {
    const setup = await setUp({ requireApproval: false });
    const { world, api } = setup;
    const chain = await wrenProposes(api, world, world.people.sam);
    await SwapChain.updateOne({ _id: chain.id }, { $set: { expiresAt: PAST } });

    const res = await api.act(world.people.sam, chain.id, 'accept');
    expect([res.status, res.body.error.details.reason]).toEqual([409, 'EXPIRED']);
    await expectUntouched(setup, chain.id, 'expired');
  });

  it('5. someone deactivated after accepting: the commit fails cleanly, and says who', async () => {
    const setup = await setUp();
    const { world, api } = setup;
    const chain = await wrenProposes(api, world);
    await api.act(world.people.sam, chain.id, 'accept');
    await api.act(world.people.tess, chain.id, 'accept');
    const gone = await request(app).delete(`/api/v1/orgs/${world.orgId}/members/${world.people.tess.membershipId}`).set(auth(world.owner.token));
    expect(gone.status).toBeLessThan(300);

    const res = await api.act(world.manager, chain.id, 'approve');

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('This swap could not be completed: Tess Third is no longer on the team.');
    expect((await SwapChain.findById(chain.id).lean()).failureReason).toBe('Tess Third is no longer on the team.');
    expect(await Notification.countDocuments({ chainId: chain.id, type: 'swap_failed' })).toBe(3);
    await expectUntouched(setup, chain.id, 'failed');
  });

  it('6. a shift changed after the proposal: the commit aborts, and nothing changes', async () => {
    const setup = await setUp();
    const { world, api } = setup;
    const chain = await wrenProposes(api, world, world.people.sam);
    await api.act(world.people.sam, chain.id, 'accept');
    await Assignment.updateOne({ _id: world.offers.sam.assignmentId }, { $inc: { version: 1 } });

    const res = await api.act(world.manager, chain.id, 'approve');

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('This swap could not be completed: one of its shifts has changed since the swap was proposed.');
    await expectUntouched(setup, chain.id, 'failed');
    expect((await Assignment.findById(world.offers.wren.assignmentId).lean()).version).toBe(0);
  });
});
