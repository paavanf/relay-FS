// resetLinkResend.test.js
// Asking for a reset link again makes the previous unused one stop working,
// and leaves another user's outstanding link alone.
//
// Lock expiry is tested by writing lockedUntil into the past rather than
// waiting three real minutes. Every test starts with one registered user.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { User, PasswordResetToken } from '../../src/models/index.js';
import { hashToken } from '../../src/utils/crypto.js';
import { useEmptyDb } from '../helpers/apiTest.js';

const world = useEmptyDb(async (app) => {
  await request(app).post('/api/v1/auth/register').send({ name: 'Lock User', ...credentials });
});
let app;
beforeEach(() => ({ app } = world));

const credentials = { email: 'lock@example.com', password: 'password123' };

describe('resending a reset link', () => {
  it('invalidates the previous unused token', async () => {
    const user = await User.findOne({ email: credentials.email });

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: hashToken('first-link-bbbbbbbb'),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    // The resend. It issues a new token and spends the old one.
    await request(app).post('/api/v1/auth/forgot-password').send({ email: credentials.email });

    const older = await PasswordResetToken.findOne({
      tokenHash: hashToken('first-link-bbbbbbbb'),
    }).lean();
    expect(older.usedAt).not.toBeNull();

    const res = await request(app)
      .post('/api/v1/auth/reset-password/first-link-bbbbbbbb')
      .send({ password: 'brandnew456' });
    expect(res.status).toBe(400);
  });

  it('leaves another user\'s outstanding token alone', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Other User', email: 'other@example.com', password: 'password123' });

    const other = await User.findOne({ email: 'other@example.com' });
    await PasswordResetToken.create({
      userId: other._id,
      tokenHash: hashToken('other-link-cccccccc'),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await request(app).post('/api/v1/auth/forgot-password').send({ email: credentials.email });

    const untouched = await PasswordResetToken.findOne({
      tokenHash: hashToken('other-link-cccccccc'),
    }).lean();
    expect(untouched.usedAt).toBeNull();
  });
});
