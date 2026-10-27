// inviteEmailDelivery.test.js
// An invite with a broken email transport is still created with a usable
// link - built from FRONTEND_URL - and says emailSent: false rather than
// pretending.
//
// Email is best-effort: a broken transport must never turn this into a
// failed request. The transport is mocked to blow up on every send - worse
// than the real one, since deliver() catches its own errors - so if the flow
// survives this it survives anything.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { Invite } from '../../src/models/index.js';
import { env } from '../../src/config/env.js';
import { useEmptyDb } from '../helpers/apiTest.js';
import { signUp } from '../helpers/orgBuilder.js';

const world = useEmptyDb();
let app;
beforeEach(() => ({ app } = world));

vi.mock('../../src/services/email/transport.js', () => ({
  EMAIL_TRANSPORT: 'console',
  chooseTransport: () => 'console',
  deliver: vi.fn(async () => {
    throw new Error('transport exploded');
  }),
}));

const signIn = () => signUp(app, 'Owner', 'owner@example.com');

describe('invites with a broken email transport', () => {
  it('still creates the invite and returns a usable link', async () => {
    const token = await signIn();
    const org = await request(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ward B', timezone: 'Asia/Kolkata' });

    const res = await request(app)
      .post(`/api/v1/orgs/${org.body.id}/invites`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'nurse@example.com', role: 'member' });

    expect(res.status).toBe(201);
    expect(res.body.inviteLink).toContain('/invite/');
    expect(await Invite.countDocuments()).toBe(1);
  });

  it('reports emailSent false rather than pretending', async () => {
    const token = await signIn();
    const org = await request(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ward B', timezone: 'Asia/Kolkata' });

    const res = await request(app)
      .post(`/api/v1/orgs/${org.body.id}/invites`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'nurse@example.com', role: 'member' });

    expect(res.body.emailSent).toBe(false);
  });

  it('builds the link from FRONTEND_URL', async () => {
    const token = await signIn();
    const org = await request(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ward B', timezone: 'Asia/Kolkata' });

    const res = await request(app)
      .post(`/api/v1/orgs/${org.body.id}/invites`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'nurse@example.com', role: 'member' });

    // Not a hardcoded host, and not corsOrigins[0].
    expect(res.body.inviteLink.startsWith(`${env.FRONTEND_URL}/invite/`)).toBe(true);
  });
});
