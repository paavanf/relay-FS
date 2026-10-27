// configWorld.js
// The organisation the Milestone 2 configuration tests run against: an owner
// with an organisation and one ordinary member in it, built through the API
// before every test. useConfigWorld() registers the hooks - start the
// in-memory database, rebuild the world before each test, stop it after the
// file - and returns an object holding the world, filled in before each test.
// orgFields are sent when the organisation is created (a timezone, say).

import { beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { signUp as signUpAs } from '../helpers/orgBuilder.js';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';

export const auth = (token) => ({ Authorization: `Bearer ${token}` });

// A test sign-in (helpers/identity.js); the first request creates the user.
export const signUp = (app, email) => signUpAs(app, 'Person', email);

// An owner with an organisation, plus an ordinary member inside it.
async function seedOrgWithMember(app, orgFields) {
  const ownerToken = await signUp(app, 'owner@example.com');
  const org = await request(app).post('/api/v1/orgs').set(auth(ownerToken)).send({ name: 'Ward A', ...orgFields });
  const orgId = org.body.id;

  const invite = await request(app).post(`/api/v1/orgs/${orgId}/invites`).set(auth(ownerToken)).send({ email: 'nurse@example.com', role: 'member' });
  const rawToken = invite.body.inviteLink.split('/invite/')[1];
  const memberToken = await signUp(app, 'nurse@example.com');
  await request(app).post(`/api/v1/invites/${rawToken}/accept`).set(auth(memberToken));

  const members = await request(app).get(`/api/v1/orgs/${orgId}/members`).set(auth(ownerToken));
  const memberMembershipId = members.body.members.find((m) => m.email === 'nurse@example.com').id;
  return { ownerToken, memberToken, orgId, memberMembershipId };
}

export function useConfigWorld(orgFields = {}) {
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
    Object.assign(world, await seedOrgWithMember(world.app, orgFields));
  });
  return world;
}

export async function makeQualification(world, code = 'RN') {
  const res = await request(world.app)
    .post(`/api/v1/orgs/${world.orgId}/qualifications`)
    .set(auth(world.ownerToken))
    .send({ name: 'Registered Nurse', code });
  return res.body.qualification;
}

export async function makeTemplate(world, name = 'Night') {
  const res = await request(world.app)
    .post(`/api/v1/orgs/${world.orgId}/shift-templates`)
    .set(auth(world.ownerToken))
    .send({ name, startLocal: '23:00', endLocal: '07:00', category: 'night' });
  return res.body.template;
}
