// notificationExpiry.test.js
// Old notifications go: a TTL index deletes each one NOTIFICATION_TTL_DAYS
// (90) after it was written (models/Notification.js).
//
// MongoDB's TTL monitor normally wakes once a minute; on the in-memory test
// server it is told to wake every second, so a notification written 91 days
// ago is seen to disappear while yesterday's stays. And every notification
// notify() writes - through an upsert - carries the createdAt it counts from.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import { startTestDb, stopTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Notification } from '../../src/models/index.js';
import { NOTIFICATION_TTL_DAYS } from '../../src/config/constants.js';
import { buildOrg } from '../helpers/orgBuilder.js';

const DAY_MS = 86_400_000;

beforeAll(async () => {
  await startTestDb();
  await Notification.init();
  await mongoose.connection.db.admin().command({ setParameter: 1, ttlMonitorSleepSecs: 1 });
}, 120_000);
afterAll(stopTestDb);

const written = (daysAgo, message) => ({
  orgId: new mongoose.Types.ObjectId(),
  membershipId: new mongoose.Types.ObjectId(),
  type: 'member_joined',
  message,
  createdAt: new Date(Date.now() - daysAgo * DAY_MS),
});

describe('notification expiry', () => {
  it(`keeps a TTL index that deletes notifications ${NOTIFICATION_TTL_DAYS} days after they were written`, async () => {
    const indexes = await Notification.collection.indexes();
    expect(indexes.find((index) => index.expireAfterSeconds !== undefined)).toMatchObject({
      key: { createdAt: 1 },
      expireAfterSeconds: NOTIFICATION_TTL_DAYS * 24 * 60 * 60,
    });
  });

  it('deletes one written more than 90 days ago, and keeps one from yesterday', async () => {
    await Notification.collection.insertMany([written(NOTIFICATION_TTL_DAYS + 1, 'old'), written(1, 'recent')]);
    await vi.waitFor(async () => expect(await Notification.exists({ message: 'old' })).toBeNull(), { timeout: 20_000, interval: 500 });
    expect(await Notification.exists({ message: 'recent' })).toBeTruthy();
  });

  it('stamps the time on every notification notify() writes', async () => {
    await buildOrg(createApp());
    const joined = await Notification.find({ type: 'member_joined', message: /joined the team/ }).lean();
    expect(joined.length).toBeGreaterThan(0);
    for (const notification of joined) expect(Date.now() - notification.createdAt.getTime()).toBeLessThan(60_000);
  });
});
