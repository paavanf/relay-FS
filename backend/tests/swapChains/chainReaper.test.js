// chainReaper.test.js
// Expiry, which no timer drives:
//
//   the reaper (POST /internal/reap-expired) refuses a missing or wrong
//   secret, expires every chain past its time and lets go of its shifts,
//   and is safe to run again
//   any read of a chain past its time expires it on the spot

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Notification, SwapChain } from '../../src/models/index.js';
import { chainWorld, chainApi, wrenProposes } from './chainWorld.js';
import { snapshot, expectInvariants, holdersNow, expectNothingChanged } from './chainInvariants.js';

const PAST = new Date(Date.now() - 60_000);
const reap = (secret) => {
  const call = request(app).post('/api/v1/internal/reap-expired');
  return secret === undefined ? call : call.set('X-Internal-Job-Secret', secret);
};

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

describe('the reaper', () => {
  it('refuses a missing or wrong secret, and changes nothing', async () => {
    const chain = await wrenProposes(api, world, world.people.sam);
    await SwapChain.updateOne({ _id: chain.id }, { $set: { expiresAt: PAST } });

    expect((await reap()).status).toBe(401);
    expect((await reap('wrong-secret')).status).toBe(401);
    expect((await reap(`${process.env.INTERNAL_JOB_SECRET}x`)).status).toBe(401);
    expect((await SwapChain.findById(chain.id).lean()).status).toBe('proposed');
  });

  it('expires every chain past its time, lets go of its shifts, and is safe to run again', async () => {
    const holders = await holdersNow();
    const chain = await wrenProposes(api, world, world.people.sam);
    await SwapChain.updateOne({ _id: chain.id }, { $set: { expiresAt: PAST } });

    const first = await reap(process.env.INTERNAL_JOB_SECRET);
    expect([first.status, first.body]).toEqual([200, { expired: 1, released: 0 }]);
    await expectNothingChanged(chain.id, 'expired', holders, 3);
    expect(await Notification.countDocuments({ chainId: chain.id, type: 'swap_expired' })).toBe(2);

    const again = await reap(process.env.INTERNAL_JOB_SECRET);
    expect(again.body).toEqual({ expired: 0, released: 0 });
    await expectInvariants(before);
  });
});

describe('expiry on read', () => {
  it('expires a chain past its time the moment anyone looks at it', async () => {
    const holders = await holdersNow();
    const chain = await wrenProposes(api, world, world.people.sam);
    await SwapChain.updateOne({ _id: chain.id }, { $set: { expiresAt: PAST } });

    const res = await api.show(world.people.sam, chain.id);

    expect(res.body.chain).toMatchObject({ status: 'expired', waitingForYou: false });
    await expectNothingChanged(chain.id, 'expired', holders, 3);
    await expectInvariants(before);
  });
});
