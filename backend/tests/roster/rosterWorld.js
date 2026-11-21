// rosterWorld.js
// The organisation the roster and assignment API tests run against: an
// owner, one worker (a nurse) and a day shift template, built through the
// API before every test. useRosterWorld() registers the hooks - start the
// in-memory database, rebuild the world before each test, stop it after the
// file - and returns an object holding the world, filled in before each test.

import { beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { signUp as signUpAs } from '../helpers/orgBuilder.js';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';

export const auth = (token) => ({ Authorization: `Bearer ${token}` });

// A test sign-in (helpers/identity.js); the first request creates the user.
const signUp = (app, email) => signUpAs(app, 'Person', email);

async function buildWorld(app) {
  const ownerToken = await signUp(app, 'owner@example.com');
  const org = await request(app).post('/api/v1/orgs').set(auth(ownerToken)).send({ name: 'Ward A', timezone: 'Europe/London' });
  const orgId = org.body.id;

  const template = await request(app)
    .post(`/api/v1/orgs/${orgId}/shift-templates`)
    .set(auth(ownerToken))
    .send({ name: 'Day', startLocal: '07:00', endLocal: '15:00', category: 'day' });
  const templateId = String(template.body.template._id);

  const workerToken = await signUp(app, 'nurse@example.com');
  const invite = await request(app).post(`/api/v1/orgs/${orgId}/invites`).set(auth(ownerToken)).send({ email: 'nurse@example.com', role: 'member' });
  const token = invite.body.inviteLink.split('/invite/')[1];
  await request(app).post(`/api/v1/invites/${token}/accept`).set(auth(workerToken));

  const members = await request(app).get(`/api/v1/orgs/${orgId}/members`).set(auth(ownerToken));
  const workerMembershipId = members.body.members.find((m) => m.email === 'nurse@example.com').id;
  return { ownerToken, workerToken, orgId, templateId, workerMembershipId };
}

export function useRosterWorld() {
  const world = {};
  beforeAll(async () => {
    await startTestDb();
    world.app = createApp();
  }, 120_000);
  afterAll(async () => {
    await stopTestDb();
  });
  beforeEach(async () => {
    await clearTestDb();
    Object.assign(world, await buildWorld(world.app));
  });
  return world;
}

/** POST /rosters as the owner: the first week of March 2026 unless the body says otherwise. */
export function makeRoster(world, body = {}) {
  return request(world.app)
    .post(`/api/v1/orgs/${world.orgId}/rosters`)
    .set(auth(world.ownerToken))
    .send({ name: 'March', startDate: '2026-03-02', endDate: '2026-03-08', ...body });
}
