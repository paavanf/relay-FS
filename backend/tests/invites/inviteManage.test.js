// inviteManage.test.js
// A manager's side of invites: the pending list, revoking, and refusing
// qualifications that belong to another organisation.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Invite } from '../../src/models/index.js';
import { auth, buildOrg, sendInvite, signUp, createOrg } from '../helpers/orgBuilder.js';

let app;
let org;

const invitesOf = (token) => request(app).get(`/api/v1/orgs/${org.orgId}/invites`).set(auth(token));
const revoke = (orgId, inviteId, token) =>
  request(app).delete(`/api/v1/orgs/${orgId}/invites/${inviteId}`).set(auth(token));

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  org = await buildOrg(app);
});

describe('managing invites', () => {
  it('lists only invites still waiting, flagging the expired ones', async () => {
    await sendInvite(app, { orgId: org.orgId, token: org.manager.token, email: 'fresh@example.com' });
    const stale = await sendInvite(app, { orgId: org.orgId, token: org.owner.token, email: 'stale@example.com' });
    await Invite.updateOne({ _id: stale.inviteId }, { $set: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await invitesOf(org.manager.token);

    // The manager's and worker's own invites were accepted in buildOrg.
    expect(res.status).toBe(200);
    expect(res.body.invites.map((i) => [i.email, i.isExpired]).sort()).toEqual([
      ['fresh@example.com', false],
      ['stale@example.com', true],
    ]);
    expect(res.body.invites[0]).toMatchObject({ role: 'member' });
    expect(res.body.invites.find((i) => i.email === 'fresh@example.com').invitedBy).toBe('Mo Manager');
  });

  it('revokes a pending invite, once', async () => {
    const { inviteId } = await sendInvite(app, { orgId: org.orgId, token: org.owner.token, email: 'x@example.com' });

    expect((await revoke(org.orgId, inviteId, org.manager.token)).status).toBe(204);
    expect((await revoke(org.orgId, inviteId, org.manager.token)).status).toBe(404);
    expect((await invitesOf(org.owner.token)).body.invites).toHaveLength(0);
  });

  it('keeps workers out of the invite list and revoking', async () => {
    const { inviteId } = await sendInvite(app, { orgId: org.orgId, token: org.owner.token, email: 'x@example.com' });

    expect((await invitesOf(org.worker.token)).status).toBe(403);
    expect((await revoke(org.orgId, inviteId, org.worker.token)).status).toBe(403);
  });

  it('cannot revoke another organisation\'s invite', async () => {
    const otherOwner = await signUp(app, 'Other Owner', 'other@example.com');
    const otherOrg = await createOrg(app, otherOwner, 'Ward B');
    const theirs = await sendInvite(app, { orgId: otherOrg, token: otherOwner, email: 'x@example.com' });

    expect((await revoke(org.orgId, theirs.inviteId, org.owner.token)).status).toBe(404);
  });

  it('refuses a qualification from another organisation', async () => {
    const otherOwner = await signUp(app, 'Other Owner', 'other@example.com');
    const otherOrg = await createOrg(app, otherOwner, 'Ward B');
    const foreign = await request(app)
      .post(`/api/v1/orgs/${otherOrg}/qualifications`)
      .set(auth(otherOwner))
      .send({ name: 'Registered Nurse', code: 'RN' });

    const { res } = await sendInvite(app, {
      orgId: org.orgId,
      token: org.owner.token,
      email: 'x@example.com',
      qualificationIds: [String(foreign.body.qualification._id)],
    });

    expect(res.status).toBe(404);
  });
});
