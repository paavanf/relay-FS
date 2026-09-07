// accountLockout.test.js
// Covers the per-account lockout that sits on top of the IP rate limiter,
// and the rule that a fresh reset request invalidates the previous link.
//
// Lock expiry is tested by writing lockedUntil into the past rather than
// waiting three real minutes.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { User, PasswordResetToken } from '../../src/models/index.js';
import { MAX_FAILED_LOGIN_ATTEMPTS } from '../../src/config/constants.js';
import { hashToken } from '../../src/utils/crypto.js';

let app;

const credentials = { email: 'lock@example.com', password: 'password123' };

function attemptLogin(password) {
  return request(app).post('/api/v1/auth/login').send({ email: credentials.email, password });
}

async function failLoginTimes(count) {
  for (let i = 0; i < count; i += 1) {
    await attemptLogin('wrongpassword');
  }
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
  await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Lock User', ...credentials });
});

describe('account lockout', () => {
  it('counts consecutive failures without locking before the limit', async () => {
    await failLoginTimes(MAX_FAILED_LOGIN_ATTEMPTS - 1);

    const user = await User.findOne({ email: credentials.email }).lean();
    expect(user.failedLoginAttempts).toBe(MAX_FAILED_LOGIN_ATTEMPTS - 1);
    expect(user.lockedUntil).toBeNull();

    // The correct password still works right up to the limit.
    const res = await attemptLogin(credentials.password);
    expect(res.status).toBe(200);
  });

  it('locks the account on the attempt that reaches the limit', async () => {
    await failLoginTimes(MAX_FAILED_LOGIN_ATTEMPTS);

    const user = await User.findOne({ email: credentials.email }).lean();
    expect(user.lockedUntil).not.toBeNull();
    expect(user.lockedUntil.getTime()).toBeGreaterThan(Date.now());
  });

  it('refuses the correct password while locked, with a 429', async () => {
    await failLoginTimes(MAX_FAILED_LOGIN_ATTEMPTS);

    const res = await attemptLogin(credentials.password);
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
    expect(res.body.error.message).toMatch(/too many failed attempts/i);
  });

  it('lets the user back in once the lock expires', async () => {
    await failLoginTimes(MAX_FAILED_LOGIN_ATTEMPTS);
    await User.updateOne({ email: credentials.email }, { lockedUntil: new Date(Date.now() - 1000) });

    const res = await attemptLogin(credentials.password);
    expect(res.status).toBe(200);

    // A successful login wipes the slate.
    const user = await User.findOne({ email: credentials.email }).lean();
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockedUntil).toBeNull();
  });

  it('resets the counter after a successful login', async () => {
    await failLoginTimes(2);
    await attemptLogin(credentials.password);

    const user = await User.findOne({ email: credentials.email }).lean();
    expect(user.failedLoginAttempts).toBe(0);
  });

  it('does no lockout bookkeeping for an unknown email', async () => {
    for (let i = 0; i < MAX_FAILED_LOGIN_ATTEMPTS + 1; i += 1) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrongpassword' });

      // Always the generic 401 - a 429 here would confirm the address exists.
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password');
    }
  });

  it('clears the lockout when the password is reset', async () => {
    await failLoginTimes(MAX_FAILED_LOGIN_ATTEMPTS);

    const user = await User.findOne({ email: credentials.email });
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: hashToken('unlock-token-aaaaaaaa'),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await request(app)
      .post('/api/v1/auth/reset-password/unlock-token-aaaaaaaa')
      .send({ password: 'brandnew456' });

    // Locked a moment ago, but the new password works immediately.
    const res = await attemptLogin('brandnew456');
    expect(res.status).toBe(200);
  });
});

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
