// inviteAccept.test.js
// POST /invites/:token/accept - joining an organisation from an invite.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { auth, signUp, createOrg, sendInvite, membershipIdOf } from '../helpers/orgBuilder.js';

let app;
let orgId;
let ownerToken;

const accept = (rawToken, token) => request(app).post(`/api/v1/invites/${rawToken}/accept`).set(auth(token));

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  ownerToken = await signUp(app, 'Olive Owner', 'owner@example.com');
  orgId = await createOrg(app, ownerToken, 'Ward A');
});

describe('accepting an invite', () => {
  it('joins the organisation when the signed-in email matches', async () => {
    const { rawToken } = await sendInvite(app, { orgId, token: ownerToken, email: 'nurse@example.com' });
    const nurse = await signUp(app, 'Nina Nurse', 'nurse@example.com');
    const res = await accept(rawToken, nurse);

    expect(res.status).toBe(201);
    expect(res.body.membership).toEqual({
      orgId,
      orgName: 'Ward A',
      orgTimezone: 'Europe/London',
      role: 'member',
      qualificationIds: [],
    });
    const me = await request(app).get('/api/v1/auth/me').set(auth(nurse));
    expect(me.body.memberships.map((m) => m.orgId)).toContain(orgId);
  });

  it('refuses a different email, and leaves the invite usable by the right person', async () => {
    const { rawToken } = await sendInvite(app, { orgId, token: ownerToken, email: 'nurse@example.com' });
    const stranger = await signUp(app, 'Sam Stranger', 'stranger@example.com');

    expect((await accept(rawToken, stranger)).status).toBe(403);
    expect((await request(app).get(`/api/v1/invites/${rawToken}`)).status).toBe(200);
  });

  it('refuses someone who is already a member', async () => {
    const { rawToken } = await sendInvite(app, { orgId, token: ownerToken, email: 'owner@example.com' });

    expect((await accept(rawToken, ownerToken)).status).toBe(409);
  });

  it('turns a deactivated member back on rather than duplicating them', async () => {
    const first = await sendInvite(app, { orgId, token: ownerToken, email: 'nurse@example.com' });
    const nurse = await signUp(app, 'Nina Nurse', 'nurse@example.com');
    await accept(first.rawToken, nurse);
    const id = await membershipIdOf(app, { orgId, token: ownerToken, email: 'nurse@example.com' });
    await request(app).delete(`/api/v1/orgs/${orgId}/members/${id}`).set(auth(ownerToken));

    const again = await sendInvite(app, { orgId, token: ownerToken, email: 'nurse@example.com' });
    expect((await accept(again.rawToken, nurse)).status).toBe(201);
    expect(await membershipIdOf(app, { orgId, token: ownerToken, email: 'nurse@example.com' })).toBe(id);
  });

  it('needs a signed-in user', async () => {
    const { rawToken } = await sendInvite(app, { orgId, token: ownerToken, email: 'nurse@example.com' });

    expect((await request(app).post(`/api/v1/invites/${rawToken}/accept`)).status).toBe(401);
  });
});
