// orgBuilder.js
// Builds real organisations through the API for the team-management tests:
// sign people up, create an organisation, invite and accept. Going through
// the API rather than the models means every test also exercises the paths a
// real team takes to come together.

import request from 'supertest';

export const auth = (token) => ({ Authorization: `Bearer ${token}` });

export async function signUp(app, name, email) {
  await request(app).post('/api/v1/auth/register').send({ name, email, password: 'password123' });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'password123' });
  return res.body.accessToken;
}

export async function createOrg(app, ownerToken, name = 'Ward A') {
  const res = await request(app)
    .post('/api/v1/orgs')
    .set(auth(ownerToken))
    .send({ name, timezone: 'Europe/London' });
  return res.body.id;
}

/** Sends an invite; returns the raw token from its link, and its id. */
export async function sendInvite(app, { orgId, token, email, role = 'member', qualificationIds = [] }) {
  const res = await request(app)
    .post(`/api/v1/orgs/${orgId}/invites`)
    .set(auth(token))
    .send({ email, role, qualificationIds });
  return { res, rawToken: res.body.inviteLink?.split('/invite/')[1], inviteId: res.body.inviteId };
}

export async function membershipIdOf(app, { orgId, token, email }) {
  const res = await request(app).get(`/api/v1/orgs/${orgId}/members`).set(auth(token));
  return res.body.members.find((m) => m.email === email)?.id;
}

/** Signs someone up and brings them into the organisation by invite. */
export async function join(app, { orgId, ownerToken, name, email, role = 'member', qualificationIds }) {
  const token = await signUp(app, name, email);
  const { rawToken } = await sendInvite(app, { orgId, token: ownerToken, email, role, qualificationIds });
  await request(app).post(`/api/v1/invites/${rawToken}/accept`).set(auth(token));
  return { token, membershipId: await membershipIdOf(app, { orgId, token: ownerToken, email }) };
}

/** An owner, a manager and a worker in one organisation. */
export async function buildOrg(app, prefix = 'a') {
  const ownerToken = await signUp(app, 'Olive Owner', `owner-${prefix}@example.com`);
  const orgId = await createOrg(app, ownerToken, `Ward ${prefix.toUpperCase()}`);
  const manager = await join(app, { orgId, ownerToken, name: 'Mo Manager', email: `manager-${prefix}@example.com`, role: 'manager' });
  const worker = await join(app, { orgId, ownerToken, name: 'Wren Worker', email: `worker-${prefix}@example.com` });
  const ownerId = await membershipIdOf(app, { orgId, token: ownerToken, email: `owner-${prefix}@example.com` });

  return { orgId, owner: { token: ownerToken, membershipId: ownerId }, manager, worker };
}
