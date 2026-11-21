// notifyFailures.test.js
// Telling people is best-effort (Milestone 9): when a notification cannot
// be written, or an email cannot be sent, the action that caused it still
// happens and still answers as it should. The email service is replaced by
// one that always fails; the database is made to refuse notifications.

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Notification, Roster, SwapChain } from '../../src/models/index.js';
import { emailsSettled } from '../../src/services/notification/index.js';
import { auth } from '../helpers/orgBuilder.js';
import { chainWorld, chainApi, optionKey } from '../swapChains/chainWorld.js';

vi.mock('../../src/services/email/email.service.js', () => ({
  sendNoticeEmail: vi.fn(async () => {
    throw new Error('The mail server is down');
  }),
  sendInviteEmail: vi.fn(async () => false),
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
});
afterEach(() => vi.restoreAllMocks());

const propose = async () => {
  const key = await optionKey(api, world.people.wren, world.offers.wren.requestId, world.people.sam);
  return api.propose(world.people.wren, world.offers.wren.requestId, key);
};

describe('when telling people fails', () => {
  it('a notification that cannot be written never fails the swap or the publish', async () => {
    const before = await Notification.countDocuments();
    vi.spyOn(Notification, 'updateOne').mockRejectedValue(new Error('The database refused it'));

    const proposed = await propose();
    expect(proposed.status).toBe(201);
    expect(await SwapChain.countDocuments({ status: 'proposed' })).toBe(1);

    await world.shift(world.draft, world.people.tess.membershipId, 20);
    const published = await request(app).post(`/api/v1/orgs/${world.orgId}/rosters/${world.draft._id}/publish`).set(auth(world.manager.token));
    expect(published.status).toBe(200);
    expect((await Roster.findById(world.draft._id).lean()).status).toBe('published');
    expect(await Notification.countDocuments()).toBe(before);
  });

  it('an email that cannot be sent never fails the action, and the notification is still there', async () => {
    const proposed = await propose();
    await emailsSettled();

    expect(proposed.status).toBe(201);
    expect(await Notification.countDocuments({ type: 'swap_proposed', membershipId: world.people.sam.membershipId })).toBe(1);
    const accepted = await api.act(world.people.sam, proposed.body.chain.id, 'accept');
    expect([accepted.status, accepted.body.chain.status]).toEqual([200, 'awaiting_approval']);
    await emailsSettled();
  });
});
