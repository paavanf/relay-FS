// demoLocks.test.js
// The shared demo organisation stays usable for the next visitor
// (middleware/refuseInDemo.js, config/demo.js), on the real seeded demo:
//
//   its setup is locked     every locked change answers 403 DEMO_LOCKED
//   what it is for is open  rosters, availability, offers, notifications
//   its accounts stay in it they cannot create or join another organisation
//   and are never locked    wrong passwords do not shut the next visitor out

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { startTestServer, stopTestDb, testServerUri } from '../helpers/db.js';
import { seed } from '../helpers/demoSeed.js';
import { createApp } from '../../src/app.js';
import { Assignment, CoverageRequirement, Membership, Qualification, ShiftTemplate, User } from '../../src/models/index.js';
import { DEMO_PASSWORD } from '../../scripts/demo/ward.js';
import { DEMO_ORG_ID, DEMO_LOCKED_MESSAGE, DEMO_ACCOUNT_MESSAGE } from '../../src/config/demo.js';
import { setupRecipes } from '../tenancy/setupRecipes.js';
import { fill } from '../tenancy/fuzzCalls.js';
import { auth, signUp, createOrg, sendInvite } from '../helpers/orgBuilder.js';
import { tokenFor } from '../helpers/identity.js';

const LOCKED = [
  'PUT /roster-rules', 'PUT /swap-rules', 'PATCH /members/:membershipId', 'DELETE /members/:membershipId', 'POST /invites',
  'POST /qualifications', 'PATCH /qualifications/:qualId', 'DELETE /qualifications/:qualId',
  'POST /shift-templates', 'PATCH /shift-templates/:templateId', 'DELETE /shift-templates/:templateId',
  'PUT /coverage', 'DELETE /coverage/:coverageId',
];

let app;
let ids;
let ashasShift;
const login = (email, password = DEMO_PASSWORD) => request(app).post('/api/v1/auth/login').send({ email, password });
const as = async (email) => auth(await tokenFor({ email })); // linked to the seeded account by email

beforeAll(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  await startTestServer();
  expect(await seed(['--yes'])).toBe(0);
  await mongoose.connect(testServerUri('relay-demo'));
  app = createApp();
  const worker = await Membership.findOne({ orgId: DEMO_ORG_ID, role: 'member' }).lean();
  ids = {
    orgId: String(DEMO_ORG_ID),
    membershipId: String(worker._id),
    qualId: String((await Qualification.findOne({ orgId: DEMO_ORG_ID }))._id),
    templateId: String((await ShiftTemplate.findOne({ orgId: DEMO_ORG_ID }))._id),
    coverageId: String((await CoverageRequirement.findOne({ orgId: DEMO_ORG_ID }))._id),
  };
  const asha = await User.findOne({ email: 'asha@relay.test' }).lean();
  ashasShift = await Assignment.findOne({ orgId: DEMO_ORG_ID, membershipId: (await Membership.findOne({ userId: asha._id }))._id }).lean();
}, 180_000);
afterAll(async () => {
  vi.restoreAllMocks();
  await stopTestDb();
});

describe('the shared demo organisation', () => {
  it('refuses every change to its setup, even from its owner', async () => {
    const owner = await as('owner@relay.test');
    for (const key of LOCKED) {
      const [method, path] = key.split(' ');
      const { body } = setupRecipes[key](ids);
      const res = await request(app)[method.toLowerCase()](fill(`/api/v1/orgs/:orgId${path}`, ids)).set(owner).send(body);
      expect([key, res.status, res.body.error?.code, res.body.error?.message]).toEqual([key, 403, 'DEMO_LOCKED', DEMO_LOCKED_MESSAGE]);
    }
  });

  it('still lets visitors do what the demo is for', async () => {
    const [owner, asha] = [await as('owner@relay.test'), await as('asha@relay.test')];
    const url = (path) => `/api/v1/orgs/${DEMO_ORG_ID}${path}`;
    const roster = { name: 'A week to try', startDate: '2026-06-01', endDate: '2026-06-07' };
    expect((await request(app).post(url('/rosters')).set(owner).send(roster)).status).toBe(201);
    expect((await request(app).put(url('/availability/me')).set(asha).send({ entries: [] })).status).toBe(200);
    expect((await request(app).post(url('/notifications/read-all')).set(owner).send({})).status).toBe(200);
    expect((await request(app).put(url('/members/me/preferences')).set(asha).send({ emailNotifications: false })).status).toBe(200);
    // The test seed sits in a week long past, so Asha is given a shift ahead to offer.
    const { orgId, rosterId, membershipId, shiftTemplateId, slotQualificationId } = ashasShift;
    const when = { date: '2030-01-08', startsAt: new Date('2030-01-08T07:00:00Z'), endsAt: new Date('2030-01-08T15:00:00Z') };
    const ahead = await Assignment.create({ orgId, rosterId, membershipId, shiftTemplateId, slotQualificationId, ...when });
    expect((await request(app).post(url('/swap-requests')).set(asha).send({ assignmentId: String(ahead._id) })).status).toBe(201);
  });

  it('keeps its accounts in it: they can neither create nor join another organisation', async () => {
    const created = await request(app).post('/api/v1/orgs').set(await as('owner@relay.test')).send({ name: 'Somewhere else' });
    expect([created.status, created.body.error.code, created.body.error.message]).toEqual([403, 'DEMO_LOCKED', DEMO_ACCOUNT_MESSAGE]);

    const realOwner = await signUp(app, 'Real Owner', 'real-owner@example.com');
    const { rawToken } = await sendInvite(app, { orgId: await createOrg(app, realOwner), token: realOwner, email: 'owner@relay.test' });
    const joined = await request(app).post(`/api/v1/invites/${rawToken}/accept`).set(await as('owner@relay.test'));
    expect([joined.status, joined.body.error.code]).toEqual([403, 'DEMO_LOCKED']);
  });

  it('never locks a demo account, however many wrong passwords are tried', async () => {
    for (let i = 0; i < 8; i += 1) expect((await login('manager@relay.test', 'not-the-password')).status).toBe(401);
    expect((await login('manager@relay.test')).status).toBe(200);
  });
});
