// accountLockout.test.js
// The per-account lockout on top of the address rate limits: failures are
// counted, the account locks on the attempt that reaches the limit, the right
// password is refused while it lasts (429), and the user gets back in after.
//
// Lock expiry is tested by writing lockedUntil into the past rather than
// waiting three real minutes. Every test starts with one registered user.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { User } from '../../src/models/index.js';
import { MAX_FAILED_LOGIN_ATTEMPTS } from '../../src/config/constants.js';
import { useEmptyDb } from '../helpers/apiTest.js';

const world = useEmptyDb(async (app) => {
  await request(app).post('/api/v1/auth/register').send({ name: 'Lock User', ...credentials });
});
let app;
beforeEach(() => ({ app } = world));

const credentials = { email: 'lock@example.com', password: 'password123' };
function attemptLogin(password) {
  return request(app).post('/api/v1/auth/login').send({ email: credentials.email, password });
}
async function failLoginTimes(count) {
  for (let i = 0; i < count; i += 1) {
    await attemptLogin('wrongpassword');
  }
}

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
});
