// resetPasswordRefusals.test.js
// Reset links that are refused - one never issued, a weak new password - and
// the sessions a reset revokes, so a stolen session does not survive it.
//
// Reset tokens are only ever emailed, so these tests put the token row in
// the database directly with a known raw value. Every test starts with one
// registered user (reset@example.com).

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { User, PasswordResetToken, RefreshToken } from '../../src/models/index.js';
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
  it('rejects a token that was never issued', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password/never-issued-dddddddd')
      .send({ password: NEW_PASSWORD });

    expect(res.status).toBe(400);
  });

  it('rejects a weak new password', async () => {
    await giveUserAResetToken('weakpw-eeeeeeeeeeee');

    const res = await request(app)
      .post('/api/v1/auth/reset-password/weakpw-eeeeeeeeeeee')
      .send({ password: 'short' });

    expect(res.status).toBe(422);
  });

  it('revokes existing sessions, so a stolen session does not survive', async () => {
    // Log in first: that session must not outlive the password change.
    const login = await request(app).post('/api/v1/auth/login').send(credentials);
    const cookie = login.headers['set-cookie'];
    expect(await RefreshToken.countDocuments({ revokedAt: null })).toBe(1);

    await giveUserAResetToken('revoke-ffffffffffff');
    await request(app)
      .post('/api/v1/auth/reset-password/revoke-ffffffffffff')
      .send({ password: NEW_PASSWORD });

    expect(await RefreshToken.countDocuments({ revokedAt: null })).toBe(0);

    const refreshed = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);
    expect(refreshed.status).toBe(401);
  });
});
