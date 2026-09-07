// passwordReset.test.js
// Covers the forgot/reset password flow: the non-enumerating response, token
// validity rules, and the session revocation that follows a reset.
//
// Reset tokens are only ever emailed, so these tests create the token row
// directly with a known raw value rather than trying to read it back out.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { User, PasswordResetToken, RefreshToken } from '../../src/models/index.js';
import { hashToken } from '../../src/utils/crypto.js';

let app;

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
    .send({ name: 'Reset User', ...credentials });
});

describe('POST /api/v1/auth/forgot-password', () => {
  it('answers identically for registered and unknown emails', async () => {
    const known = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: credentials.email });

    const unknown = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    // Any difference here would let someone test which emails have accounts.
    expect(known.body.message).toBe(unknown.body.message);
  });

  it('creates a token for a real user, and none for a stranger', async () => {
    await request(app).post('/api/v1/auth/forgot-password').send({ email: credentials.email });
    expect(await PasswordResetToken.countDocuments()).toBe(1);

    await request(app).post('/api/v1/auth/forgot-password').send({ email: 'nobody@example.com' });
    expect(await PasswordResetToken.countDocuments()).toBe(1);
  });

  it('never stores the raw token', async () => {
    await request(app).post('/api/v1/auth/forgot-password').send({ email: credentials.email });

    const doc = await PasswordResetToken.findOne().lean();
    expect(doc.tokenHash).toMatch(/^[0-9a-f]{64}$/); // sha256 hex
    expect(doc.usedAt).toBeNull();
  });
});

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

describe('duplicate email handling', () => {
  it('rejects a second signup with the same email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Someone Else', ...credentials });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects it regardless of casing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Someone Else', email: 'RESET@Example.COM', password: 'password123' });

    expect(res.status).toBe(409);
  });
});
