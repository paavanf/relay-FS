// emailDelivery.test.js
// A password reset with a broken email transport still answers 200, and still
// creates the token, so the link printed to the console works.
//
// Email is best-effort: a broken transport must never turn this into a
// failed request. The transport is mocked to blow up on every send - worse
// than the real one, since deliver() catches its own errors - so if the flow
// survives this it survives anything.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { PasswordResetToken } from '../../src/models/index.js';
import { useEmptyDb } from '../helpers/apiTest.js';

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

const owner = { name: 'Owner', email: 'owner@example.com', password: 'password123' };

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
