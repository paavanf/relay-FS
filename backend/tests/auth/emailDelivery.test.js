// emailDelivery.test.js
// Email is best-effort. These tests pin down what that means in practice: a
// transport that is broken, or absent entirely, must never turn a password
// reset or an invite into a failed request.
//
// The transport is mocked to blow up on every send - the worst case, worse
// than the real one, since deliver() normally catches its own errors. If the
// flows survive this they survive anything.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { PasswordResetToken, Invite } from '../../src/models/index.js';
import { env } from '../../src/config/env.js';

vi.mock('../../src/services/email/transport.js', () => ({
  EMAIL_TRANSPORT: 'console',
  chooseTransport: () => 'console',
  deliver: vi.fn(async () => {
    throw new Error('transport exploded');
  }),
}));

let app;

const owner = { name: 'Owner', email: 'owner@example.com', password: 'password123' };

async function signIn() {
  await request(app).post('/api/v1/auth/register').send(owner);
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: owner.email, password: owner.password });
  return login.body.accessToken;
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

describe('password reset with a broken email transport', () => {
  it('still answers 200', async () => {
    await request(app).post('/api/v1/auth/register').send(owner);

    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: owner.email });

    expect(res.status).toBe(200);
  });

  it('still creates the token, so the link from the console works', async () => {
    await request(app).post('/api/v1/auth/register').send(owner);
    await request(app).post('/api/v1/auth/forgot-password').send({ email: owner.email });

    // The reset is usable even though nothing was delivered - which is the
    // whole point of logging the link.
    expect(await PasswordResetToken.countDocuments()).toBe(1);
  });
});

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
