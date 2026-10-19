// notificationApi.test.js
// The notification API (Milestone 9), checked on the raw JSON:
//   a member only ever sees their own notifications - nobody else's id,
//   message or membership appears in anything they get back
//   paging is by cursor, newest first, and can ask for unread only
//   marking read, one or all, only ever touches their own
//   the email preference is theirs to read and change, checked strictly

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Notification } from '../../src/models/index.js';
import { auth } from '../helpers/orgBuilder.js';
import { swapWorld } from '../swaps/swapWorld.js';

let app;
let world;
let samsNotice;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);
afterAll(stopTestDb);

const notice = (person, i) => ({ orgId: world.orgId, membershipId: person.membershipId, type: 'swap_expired', message: `Notice ${i} for ${person.membershipId}`, link: `/app/${world.orgId}/swaps` });

beforeEach(async () => {
  await clearTestDb();
  world = await swapWorld(app);
  await Notification.deleteMany({});
  for (let i = 1; i <= 25; i += 1) await Notification.create(notice(world.worker, i));
  [samsNotice] = await Notification.create([notice(world.sam, 1)]);
});

const call = (method, path, person) => request(app)[method](`/api/v1/orgs/${world.orgId}/notifications${path}`).set(auth(person.token));

describe('the notification API', () => {
  it('lists only your own, newest first, a page at a time - nobody else appears in the raw JSON', async () => {
    const first = await call('get', '', world.worker);
    expect(first.status).toBe(200);
    expect(first.body.notifications.map((n) => n.message).slice(0, 2)).toEqual([`Notice 25 for ${world.worker.membershipId}`, `Notice 24 for ${world.worker.membershipId}`]);
    expect(first.body.notifications).toHaveLength(20);
    expect(first.text).not.toContain(String(samsNotice._id));
    expect(first.text).not.toContain(world.sam.membershipId);

    const second = await call('get', `?cursor=${first.body.nextCursor}`, world.worker);
    expect(second.body.notifications).toHaveLength(5);
    expect(second.body.nextCursor).toBeNull();

    const sams = await call('get', '', world.sam);
    expect(sams.body.notifications.map((n) => n.id)).toEqual([String(samsNotice._id)]);
    expect(sams.text).not.toContain(world.worker.membershipId);
  });

  it('counts and lists unread ones, and marks one read - only your own', async () => {
    const [newest] = (await call('get', '?limit=1', world.worker)).body.notifications;
    expect((await call('post', `/${newest.id}/read`, world.worker)).body.notification).toMatchObject({ id: newest.id, read: true });
    expect((await call('get', '/unread-count', world.worker)).body).toEqual({ count: 24 });
    expect((await call('get', '?unread=true&limit=50', world.worker)).body.notifications.map((n) => n.id)).not.toContain(newest.id);

    // Someone else's notification is answered as one that does not exist, and left alone.
    expect((await call('post', `/${samsNotice._id}/read`, world.worker)).status).toBe(404);
    expect((await Notification.findById(samsNotice._id).lean()).readAt).toBeNull();
  });

  it('marks all read - only your own - and keeps the first time each was read', async () => {
    const [newest] = (await call('get', '?limit=1', world.worker)).body.notifications;
    await call('post', `/${newest.id}/read`, world.worker);
    const firstRead = (await Notification.findById(newest.id).lean()).readAt;

    expect((await call('post', '/read-all', world.worker)).body).toEqual({ marked: 24 });
    expect((await call('get', '/unread-count', world.worker)).body).toEqual({ count: 0 });
    expect((await call('get', '/unread-count', world.sam)).body).toEqual({ count: 1 });
    expect((await Notification.findById(newest.id).lean()).readAt).toEqual(firstRead);
  });

  it('refuses what it does not understand', async () => {
    expect((await call('get', '?cursor=not-an-id', world.worker)).status).toBe(422);
    expect((await call('get', '?limit=0', world.worker)).status).toBe(422);
    expect((await call('get', '?membershipId=someone', world.worker)).status).toBe(422);
    expect((await call('post', '/read-all', world.worker).send({ membershipId: world.sam.membershipId })).status).toBe(422);
  });
});

describe('the email preference', () => {
  const prefs = (method, person) => request(app)[method](`/api/v1/orgs/${world.orgId}/members/me/preferences`).set(auth(person.token));

  it('is on by default, yours to change, and checked strictly', async () => {
    expect((await prefs('get', world.worker)).body).toEqual({ preferences: { emailNotifications: true } });
    expect((await prefs('put', world.worker).send({ emailNotifications: false })).body).toEqual({ preferences: { emailNotifications: false } });
    expect((await prefs('get', world.worker)).body.preferences.emailNotifications).toBe(false);
    expect((await prefs('get', world.sam)).body.preferences.emailNotifications).toBe(true);

    expect((await prefs('put', world.worker).send({ emailNotifications: 'no' })).status).toBe(422);
    expect((await prefs('put', world.worker).send({ emailNotifications: true, membershipId: world.sam.membershipId })).status).toBe(422);
  });
});
