// invitePreview.test.js
// GET /invites/:token - the public preview an invite link shows.
//
// The rule worth pinning hardest: an expired, a used, a revoked and an unknown
// token must be indistinguishable. Same status, same code, same message.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Invite } from '../../src/models/index.js';
import { auth, signUp, createOrg, sendInvite } from '../helpers/orgBuilder.js';

let app;
let orgId;
let ownerToken;

const preview = (rawToken) => request(app).get(`/api/v1/invites/${rawToken}`);
const shapeOf = (res) => ({ status: res.status, code: res.body.error?.code, message: res.body.error?.message });

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

describe('invite preview', () => {
  it('shows the organisation, role, sender, invitee and expiry - without signing in', async () => {
    const { rawToken } = await sendInvite(app, { orgId, token: ownerToken, email: 'nurse@example.com', role: 'manager' });
    const res = await preview(rawToken);

    expect(res.status).toBe(200);
    expect(res.body.invite).toMatchObject({
      orgName: 'Ward A',
      role: 'manager',
      inviterName: 'Olive Owner',
      email: 'nurse@example.com',
    });
    expect(Date.parse(res.body.invite.expiresAt)).toBeGreaterThan(Date.now());
  });

  it('answers expired, used, revoked, unknown and malformed tokens identically', async () => {
    const expired = await sendInvite(app, { orgId, token: ownerToken, email: 'late@example.com' });
    await Invite.updateOne({ _id: expired.inviteId }, { $set: { expiresAt: new Date(Date.now() - 1000) } });

    const used = await sendInvite(app, { orgId, token: ownerToken, email: 'used@example.com' });
    const usedToken = await signUp(app, 'Used', 'used@example.com');
    await request(app).post(`/api/v1/invites/${used.rawToken}/accept`).set(auth(usedToken));

    const revoked = await sendInvite(app, { orgId, token: ownerToken, email: 'gone@example.com' });
    await request(app).delete(`/api/v1/orgs/${orgId}/invites/${revoked.inviteId}`).set(auth(ownerToken));

    const answers = await Promise.all(
      [expired.rawToken, used.rawToken, revoked.rawToken, 'a-token-that-was-never-issued', 'abc'].map(preview),
    );

    expect(answers.map(shapeOf)).toEqual(
      Array(5).fill({ status: 404, code: 'INVITE_INVALID', message: 'This invite is no longer valid' }),
    );
    for (const res of answers) expect(res.body).not.toHaveProperty('invite');
  });
});
