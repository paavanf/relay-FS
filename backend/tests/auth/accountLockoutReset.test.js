// accountLockoutReset.test.js
// What clears a lockout - a successful login resets the count, a password
// reset clears the lock - and that an unknown email does no bookkeeping.
//
// Lock expiry is tested by writing lockedUntil into the past rather than
// waiting three real minutes. Every test starts with one registered user.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { User, PasswordResetToken } from '../../src/models/index.js';
import { MAX_FAILED_LOGIN_ATTEMPTS } from '../../src/config/constants.js';
import { hashToken } from '../../src/utils/crypto.js';
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
