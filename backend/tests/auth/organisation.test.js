// organisation.test.js
// Covers multi-tenancy: creating an org, membership scoping, role checks,
// and the invite round trip.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';

let app;

// Registers someone and hands back their bearer token. Registering no longer
// starts a session, so we log in afterwards to get the token.
async function signUp(email, name = 'Someone') {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ name, email, password: 'password123' });

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'password123' });

  return res.body.accessToken;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

describe('organisations', () => {
  it('creates an org and makes the creator its owner', async () => {
    const token = await signUp('owner@example.com', 'Owner');

    const created = await request(app)
      .post('/api/v1/orgs')
      .set(auth(token))
      .send({ name: 'Ward A', timezone: 'Asia/Kolkata' });

    expect(created.status).toBe(201);
    expect(created.body.name).toBe('Ward A');

    // The creator should now show up in /me with the owner role.
    const me = await request(app).get('/api/v1/auth/me').set(auth(token));
    expect(me.body.memberships).toHaveLength(1);
    expect(me.body.memberships[0].role).toBe('owner');
    expect(me.body.memberships[0].orgName).toBe('Ward A');
  });

  it('lists members of an org the caller belongs to', async () => {
    const token = await signUp('owner@example.com', 'Owner');
    const org = await request(app).post('/api/v1/orgs').set(auth(token)).send({ name: 'Ward A' });

    const res = await request(app)
      .get(`/api/v1/orgs/${org.body.id}/members`)
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.members).toHaveLength(1);
    expect(res.body.members[0].email).toBe('owner@example.com');
  });

  it('hides an org from a non-member with 404, not 403', async () => {
    const ownerToken = await signUp('owner@example.com', 'Owner');
    const org = await request(app)
      .post('/api/v1/orgs')
      .set(auth(ownerToken))
      .send({ name: 'Ward A' });

    const outsiderToken = await signUp('outsider@example.com', 'Outsider');

    const res = await request(app)
      .get(`/api/v1/orgs/${org.body.id}/members`)
      .set(auth(outsiderToken));

    // 404 rather than 403 - a 403 would confirm the org exists.
    expect(res.status).toBe(404);
  });

  it('lets an owner invite someone, and that person join', async () => {
    const ownerToken = await signUp('owner@example.com', 'Owner');
    const org = await request(app)
      .post('/api/v1/orgs')
      .set(auth(ownerToken))
      .send({ name: 'Ward A' });

    const invited = await request(app)
      .post(`/api/v1/orgs/${org.body.id}/invites`)
      .set(auth(ownerToken))
      .send({ email: 'nurse@example.com', role: 'member' });

    expect(invited.status).toBe(201);
    expect(invited.body.inviteLink).toContain('/invite/');

    // Pull the raw token back out of the link the API returned.
    const rawToken = invited.body.inviteLink.split('/invite/')[1];

    const nurseToken = await signUp('nurse@example.com', 'Nurse');
    const accepted = await request(app)
      .post(`/api/v1/invites/${rawToken}/accept`)
      .set(auth(nurseToken));

    expect(accepted.status).toBe(201);
    expect(accepted.body.membership.role).toBe('member');

    const me = await request(app).get('/api/v1/auth/me').set(auth(nurseToken));
    expect(me.body.memberships[0].orgName).toBe('Ward A');
  });

  it('refuses an invite addressed to a different email', async () => {
    const ownerToken = await signUp('owner@example.com', 'Owner');
    const org = await request(app)
      .post('/api/v1/orgs')
      .set(auth(ownerToken))
      .send({ name: 'Ward A' });

    const invited = await request(app)
      .post(`/api/v1/orgs/${org.body.id}/invites`)
      .set(auth(ownerToken))
      .send({ email: 'intended@example.com', role: 'member' });

    const rawToken = invited.body.inviteLink.split('/invite/')[1];
    const wrongToken = await signUp('someone.else@example.com', 'Interloper');

    const res = await request(app)
      .post(`/api/v1/invites/${rawToken}/accept`)
      .set(auth(wrongToken));

    expect(res.status).toBe(403);
  });

  it('stops a plain member from inviting people', async () => {
    const ownerToken = await signUp('owner@example.com', 'Owner');
    const org = await request(app)
      .post('/api/v1/orgs')
      .set(auth(ownerToken))
      .send({ name: 'Ward A' });

    const invited = await request(app)
      .post(`/api/v1/orgs/${org.body.id}/invites`)
      .set(auth(ownerToken))
      .send({ email: 'nurse@example.com', role: 'member' });

    const rawToken = invited.body.inviteLink.split('/invite/')[1];
    const nurseToken = await signUp('nurse@example.com', 'Nurse');
    await request(app).post(`/api/v1/invites/${rawToken}/accept`).set(auth(nurseToken));

    // Now a member of the org, but only a 'member' - inviting is manager-only.
    const res = await request(app)
      .post(`/api/v1/orgs/${org.body.id}/invites`)
      .set(auth(nurseToken))
      .send({ email: 'another@example.com', role: 'member' });

    expect(res.status).toBe(403);
  });

  it('rejects a second use of the same invite', async () => {
    const ownerToken = await signUp('owner@example.com', 'Owner');
    const org = await request(app)
      .post('/api/v1/orgs')
      .set(auth(ownerToken))
      .send({ name: 'Ward A' });

    const invited = await request(app)
      .post(`/api/v1/orgs/${org.body.id}/invites`)
      .set(auth(ownerToken))
      .send({ email: 'nurse@example.com', role: 'member' });

    const rawToken = invited.body.inviteLink.split('/invite/')[1];
    const nurseToken = await signUp('nurse@example.com', 'Nurse');

    await request(app).post(`/api/v1/invites/${rawToken}/accept`).set(auth(nurseToken));
    const second = await request(app)
      .post(`/api/v1/invites/${rawToken}/accept`)
      .set(auth(nurseToken));

    // A used invite answers exactly like any other dead one.
    expect(second.status).toBe(404);
    expect(second.body.error.code).toBe('INVITE_INVALID');
  });
});
