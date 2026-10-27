// seedDemoShared.test.js
// The nightly reset reruns the demo seed on a database real people use, so
// the seed must only ever touch the demo organisation and its demo users.
// Here a real organisation with something of everything (the tenancy
// fuzzer's world: people, rosters, shifts, offers, a proposed swap,
// notifications, an invite) sits next to the demo through a
// reseed, and must come out document for document the same.
//
// One real account also belongs to the demo: that membership goes with the
// demo ward, and the account itself stays.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import { startTestServer, stopTestDb } from '../helpers/db.js';
import { seed, inDatabase } from '../helpers/demoSeed.js';
import { createApp } from '../../src/app.js';
import * as models from '../../src/models/index.js';
import { DEMO_ORG_ID } from '../../src/config/demo.js';
import { tenancyWorld } from '../tenancy/tenancyWorld.js';

const { Membership, Organisation, User } = models;
const ORG_SCOPED = ['Membership', 'Invite', 'Qualification', 'ShiftTemplate', 'CoverageRequirement', 'Availability', 'Roster',
  'Assignment', 'GenerationJob', 'FairnessLedger', 'SwapRequest', 'SwapChain', 'Notification', 'AuditLog'];

// Every document the real organisation owns, and its people - each with
// the Supabase sign-in they are linked to.
async function everythingOf(orgId) {
  const rows = { Organisation: await Organisation.find({ _id: orgId }).lean() };
  for (const name of ORG_SCOPED) rows[name] = await models[name].find({ orgId }).sort({ _id: 1 }).lean();
  const userIds = rows.Membership.map((membership) => membership.userId);
  rows.User = await User.find({ _id: { $in: userIds } }).sort({ _id: 1 }).lean();
  return JSON.parse(JSON.stringify(rows));
}

let real;
let before;

beforeAll(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  await startTestServer();
  expect(await seed(['--yes'])).toBe(0);
  await inDatabase('relay-demo', async () => {
    real = await tenancyWorld(createApp(), 'real');
    const owner = await Membership.findOne({ orgId: real.ids.orgId, role: 'owner' }).lean();
    await Membership.create({ userId: owner.userId, orgId: DEMO_ORG_ID, role: 'member', status: 'active' });
    before = await everythingOf(real.ids.orgId);
  });
}, 180_000);
afterAll(async () => {
  vi.restoreAllMocks();
  await stopTestDb();
});

describe('reseeding the demo on a shared database', () => {
  it('starts from a real organisation with something of everything', () => {
    for (const name of ['Membership', 'Roster', 'Assignment', 'SwapRequest', 'SwapChain', 'Notification', 'Invite', 'User']) {
      expect(before[name].length, name).toBeGreaterThan(0);
    }
  });

  it('leaves the real organisation exactly as it was, and its people with it', async () => {
    expect(await seed(['--yes'])).toBe(0);
    await inDatabase('relay-demo', async () => {
      expect(await everythingOf(real.ids.orgId)).toEqual(before);
      const owner = before.Membership.find((membership) => membership.role === 'owner');
      expect(await Membership.exists({ userId: owner.userId, orgId: DEMO_ORG_ID })).toBeNull();
      expect(await User.exists({ _id: owner.userId })).toBeTruthy();
      expect(mongoose.connection.name).toBe('relay-demo');
    });
  });
});
