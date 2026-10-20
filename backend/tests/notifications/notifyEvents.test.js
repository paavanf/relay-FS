// notifyEvents.test.js
// Each event notifies exactly the right people (Milestone 9), through the
// real API, read back from the database:
//
//   roster published     every worker with a shift on it - nobody else
//   swap proposed        everyone in it but the proposer
//   accepted, declined   the proposer
//   waiting for approval every manager and owner
//   approved/committed   everyone in it, once
//   failed, expired      everyone in it; cancelled - everyone but the canceller
//   someone joined       the managers and owners

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Notification, SwapChain } from '../../src/models/index.js';
import { auth, join } from '../helpers/orgBuilder.js';
import { chainWorld, chainApi, wrenProposes } from '../swapChains/chainWorld.js';

let app;
let world;
let api;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);
afterAll(stopTestDb);

beforeEach(async () => {
  await clearTestDb();
  world = await chainWorld(app);
  api = chainApi(app, world);
});

/** Who got a notification of this type, as names from the world, sorted. */
async function told(type, about = {}) {
  const names = new Map(Object.entries({ ...world.people, owner: world.owner, manager: world.manager }).map(([n, p]) => [p.membershipId, n]));
  const rows = await Notification.find({ type, ...about }).lean();
  return rows.map((row) => names.get(String(row.membershipId)) ?? 'someone else').sort();
}

describe('who hears about what', () => {
  it('a published roster: every worker with a shift on it, and nobody else', async () => {
    await world.shift(world.draft, world.people.wren.membershipId, 20);
    await world.shift(world.draft, world.people.wren.membershipId, 21);
    await world.shift(world.draft, world.people.sam.membershipId, 20);
    const res = await request(app).post(`/api/v1/orgs/${world.orgId}/rosters/${world.draft._id}/publish`).set(auth(world.manager.token));
    expect(res.status).toBe(200);

    expect(await told('roster_published')).toEqual(['sam', 'wren']);
    const wrens = await Notification.findOne({ type: 'roster_published', membershipId: world.people.wren.membershipId }).lean();
    expect(wrens.message).toMatch(/^The roster for .+ is published\. You have 2 shifts on it\.$/);
    expect(wrens.link).toBe(`/app/${world.orgId}/my-shifts`);
  });

  it('a proposal: everyone in it but the proposer; acceptances go to the proposer, a decline to everyone else in it', async () => {
    const chain = await wrenProposes(api, world);
    expect(await told('swap_proposed')).toEqual(['sam', 'tess']);

    await api.act(world.people.sam, chain.id, 'accept');
    expect(await told('swap_accepted')).toEqual(['wren']);
    await api.act(world.people.tess, chain.id, 'decline');
    expect(await told('swap_declined')).toEqual(['sam', 'wren']);
  });

  it('waiting for approval: every manager and owner - then, approved, everyone in it, once', async () => {
    const chain = await wrenProposes(api, world, world.people.sam);
    await api.act(world.people.sam, chain.id, 'accept');
    expect(await told('swap_awaiting_approval')).toEqual(['manager', 'owner']);

    await api.act(world.manager, chain.id, 'approve');
    await api.act(world.owner, chain.id, 'approve');
    expect(await told('swap_committed')).toEqual(['sam', 'wren']);
    expect(await told('swap_approved')).toEqual([]);
  });

  it('cancelled: everyone in it but whoever cancelled; expired: everyone in it', async () => {
    const cancelled = await wrenProposes(api, world, world.people.sam);
    await api.act(world.people.wren, cancelled.id, 'cancel');
    expect(await told('swap_cancelled')).toEqual(['sam']);

    const expiring = await wrenProposes(api, world, world.people.tess);
    await SwapChain.updateOne({ _id: expiring.id }, { $set: { expiresAt: new Date(Date.now() - 60_000) } });
    await api.show(world.people.tess, expiring.id);
    expect(await told('swap_expired', { chainId: expiring.id })).toEqual(['tess', 'wren']);
  });

  it('someone joining: the managers and owners, with a link to the Team page', async () => {
    await Notification.deleteMany({});
    await join(app, { orgId: world.orgId, ownerToken: world.owner.token, name: 'Nia New', email: 'nia@example.com' });

    expect(await told('member_joined')).toEqual(['manager', 'owner']);
    const notice = await Notification.findOne({ type: 'member_joined' }).lean();
    expect(notice).toMatchObject({ message: 'Nia New accepted an invite and joined the team.', link: `/app/${world.orgId}/team` });
  });
});
