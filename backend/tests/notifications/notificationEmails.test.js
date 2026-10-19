// notificationEmails.test.js
// Email for the events that expire (Milestone 9), with the email service
// replaced by a recorder - nothing is sent anywhere:
//
//   a swap proposed to someone, a swap waiting for a manager and a roster
//   published are emailed, with a link to the page; nothing else is
//   "Email me about swaps and rosters", turned off, is respected
//   the same event reported twice still sends one email per person

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { SwapChain, Notification } from '../../src/models/index.js';
import { notify, emailsSettled } from '../../src/services/notification/index.js';
import { auth } from '../helpers/orgBuilder.js';
import { chainWorld, chainApi, wrenProposes } from '../swapChains/chainWorld.js';

const sent = vi.hoisted(() => []);
vi.mock('../../src/services/email/email.service.js', () => ({
  sendNoticeEmail: vi.fn(async (to, email) => sent.push({ to, ...email }) > 0),
  sendPasswordResetEmail: vi.fn(async () => true),
  sendInviteEmail: vi.fn(async () => true),
}));

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
  await emailsSettled();
  sent.length = 0;
});

const recipients = () => sent.map((email) => email.to.split('@')[0]).sort();

describe('notification emails', () => {
  it('emails a swap proposed to someone, linking to the proposal', async () => {
    const chain = await wrenProposes(api, world, world.people.sam);
    await emailsSettled();

    expect(recipients()).toEqual(['sam']);
    expect(sent[0]).toMatchObject({
      subject: 'Wren Worker proposed a shift swap to you',
      link: `http://localhost:5173/app/${world.orgId}/swaps?chain=${chain.id}`,
      label: 'See the proposal',
    });
  });

  it('emails the managers a swap waiting for approval - and nobody the other swap events', async () => {
    const chain = await wrenProposes(api, world, world.people.sam);
    await api.act(world.people.sam, chain.id, 'accept');
    await api.act(world.manager, chain.id, 'approve');
    await emailsSettled();

    expect(recipients()).toEqual(['manager-a', 'owner-a', 'sam']);
    expect(sent.filter((email) => email.to.startsWith('manager'))[0].link).toBe(`http://localhost:5173/app/${world.orgId}/swaps/approvals?chain=${chain.id}`);
  });

  it('emails each worker on a published roster', async () => {
    await world.shift(world.draft, world.people.tess.membershipId, 20);
    await request(app).post(`/api/v1/orgs/${world.orgId}/rosters/${world.draft._id}/publish`).set(auth(world.manager.token));
    await emailsSettled();

    expect(recipients()).toEqual(['tess']);
    expect(sent[0].link).toBe(`http://localhost:5173/app/${world.orgId}/my-shifts`);
  });

  it('respects "Email me about swaps and rosters" turned off', async () => {
    await request(app).put(`/api/v1/orgs/${world.orgId}/members/me/preferences`).set(auth(world.people.sam.token)).send({ emailNotifications: false });

    await wrenProposes(api, world);
    await emailsSettled();
    expect(recipients()).toEqual(['tess']);
    expect(await Notification.countDocuments({ type: 'swap_proposed', membershipId: world.people.sam.membershipId })).toBe(1);
  });

  it('never sends the same event twice, however often it is reported', async () => {
    const proposed = await wrenProposes(api, world);
    const chain = await SwapChain.findById(proposed.id).lean();
    const report = () => notify('swap_proposed', { chain, actorId: world.people.wren.membershipId });
    await report(); // a retry, after the first
    await Promise.all([report(), report()]); // and two at the same moment
    await emailsSettled();

    expect(recipients()).toEqual(['sam', 'tess']);
    expect(await Notification.countDocuments({ type: 'swap_proposed' })).toBe(2);
  });
});
