// notifications.test.js
// GET /orgs/:orgId/notifications: each person's own notifications, newest
// first, written by what happens to the swaps they are in - and nobody
// else's, ever.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { auth } from '../helpers/orgBuilder.js';
import { chainWorld, chainApi, wrenProposes } from './chainWorld.js';

let app;
let world;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);
afterAll(stopTestDb);

beforeEach(async () => {
  await clearTestDb();
  world = await chainWorld(app);
});

const notificationsOf = async (person) =>
  (await request(app).get(`/api/v1/orgs/${world.orgId}/notifications`).set(auth(person.token))).body.notifications;

describe('notifications', () => {
  it('tell each person what happened to their swaps, newest first, and nobody else', async () => {
    const api = chainApi(app, world);
    const chain = await wrenProposes(api, world, world.people.sam);

    const [proposedToSam] = await notificationsOf(world.people.sam);
    expect(proposedToSam).toMatchObject({ type: 'swap_proposed', chainId: chain.id, read: false });
    expect(proposedToSam.message).toMatch(/^Wren Worker proposed a swap: you would give your day shift on \w+ \d+ \w+ and take the day shift on \w+ \d+ \w+\. Accept or decline it on the Swaps page\.$/);

    // Wren proposed it, so has nothing to be told yet; Tess is not in it.
    expect(await notificationsOf(world.people.wren)).toEqual([]);
    expect(await notificationsOf(world.people.tess)).toEqual([]);

    await api.act(world.people.wren, chain.id, 'cancel');
    expect((await notificationsOf(world.people.sam)).map((n) => n.type)).toEqual(['swap_cancelled', 'swap_proposed']);
    expect(await notificationsOf(world.people.wren)).toEqual([]);
  });
});
