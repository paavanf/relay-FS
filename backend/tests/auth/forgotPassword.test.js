// forgotPassword.test.js
// Asking for a reset link answers the same for registered and unknown emails,
// stores a token only for a real user - and never the raw token. And a
// second signup with the same email, in any casing, is refused.
//
// Reset tokens are only ever emailed, so these tests put the token row in
// the database directly with a known raw value. Every test starts with one
// registered user (reset@example.com).

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { PasswordResetToken } from '../../src/models/index.js';
import { useEmptyDb } from '../helpers/apiTest.js';

const world = useEmptyDb(async (app) => {
  await request(app).post('/api/v1/auth/register').send({ name: 'Reset User', ...credentials });
});
let app;
beforeEach(() => ({ app } = world));

const credentials = { email: 'reset@example.com', password: 'password123' };

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
