// resetPassword.test.js
// Using a reset link: the new password works and the old one stops; the link
// cannot be replayed, and an expired one is refused.
//
// Reset tokens are only ever emailed, so these tests put the token row in
// the database directly with a known raw value. Every test starts with one
// registered user (reset@example.com).

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { User, PasswordResetToken } from '../../src/models/index.js';
import { hashToken } from '../../src/utils/crypto.js';
import { useEmptyDb } from '../helpers/apiTest.js';

const world = useEmptyDb(async (app) => {
  await request(app).post('/api/v1/auth/register').send({ name: 'Reset User', ...credentials });
});
let app;
beforeEach(() => ({ app } = world));

const credentials = { email: 'reset@example.com', password: 'password123' };
const NEW_PASSWORD = 'brandnew456';
// Puts a usable reset token in the database and returns its raw value.
async function giveUserAResetToken(rawToken, { expiresAt } = {}) {
  const user = await User.findOne({ email: credentials.email });

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: hashToken(rawToken),
    expiresAt: expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
  });

  return user;
}

describe('POST /api/v1/auth/reset-password/:token', () => {
  it('sets the new password, and the old one stops working', async () => {
    await giveUserAResetToken('valid-token-aaaaaaaaaaaa');

    const res = await request(app)
      .post('/api/v1/auth/reset-password/valid-token-aaaaaaaaaaaa')
      .send({ password: NEW_PASSWORD });

    expect(res.status).toBe(200);

    const withNew = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: NEW_PASSWORD });
    expect(withNew.status).toBe(200);

    const withOld = await request(app).post('/api/v1/auth/login').send(credentials);
    expect(withOld.status).toBe(401);
  });

  it('marks the token used so the link cannot be replayed', async () => {
    await giveUserAResetToken('once-only-bbbbbbbbbbbb');

    const first = await request(app)
      .post('/api/v1/auth/reset-password/once-only-bbbbbbbbbbbb')
      .send({ password: NEW_PASSWORD });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post('/api/v1/auth/reset-password/once-only-bbbbbbbbbbbb')
      .send({ password: 'anotherone789' });
    expect(second.status).toBe(400);
  });

  it('rejects an expired link', async () => {
    await giveUserAResetToken('expired-cccccccccccc', { expiresAt: new Date(Date.now() - 1000) });

    const res = await request(app)
      .post('/api/v1/auth/reset-password/expired-cccccccccccc')
      .send({ password: NEW_PASSWORD });

    expect(res.status).toBe(400);
  });
});
