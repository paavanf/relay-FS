// authLimits.test.js
// The two limits on the signed-out endpoints (config/constants.js):
//
//   registration     accounts created from one address in an hour - and a
//                    form sent back with a mistake does not count
//   forgot password  reset emails for one email address in an hour, on top
//                    of the per-address limit - another address is unaffected

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { limitsInTests } from '../../src/middleware/rateLimiters.js';
import { REGISTRATION_LIMIT, FORGOT_PASSWORD_LIMIT } from '../../src/config/constants.js';
import { expectLimited } from './limitAsserts.js';

let app;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
  limitsInTests.on = true;
}, 120_000);
afterAll(async () => {
  limitsInTests.on = false;
  await stopTestDb();
});

const register = (email, password = 'password123') =>
  request(app).post('/api/v1/auth/register').send({ name: 'New Person', email, password });
const forgot = (email) => request(app).post('/api/v1/auth/forgot-password').send({ email });

describe('abuse limits on signed-out endpoints', () => {
  it(`creates at most ${REGISTRATION_LIMIT.max} accounts per address per hour, counting only accounts made`, async () => {
    expect((await register('typo@example.com', 'short')).status).toBe(422);
    for (let i = 1; i <= REGISTRATION_LIMIT.max; i += 1) {
      expect((await register(`person${i}@example.com`)).status).toBe(201);
    }
    expectLimited(await register('one-more@example.com'), /^Too many accounts have been created from your network in the last hour\./);
  });

  it(`sends at most ${FORGOT_PASSWORD_LIMIT.max} reset emails per email address per hour`, async () => {
    for (let i = 0; i < FORGOT_PASSWORD_LIMIT.max; i += 1) {
      expect((await forgot('Target@Example.com ')).status).toBe(200);
    }
    // The same address however it is typed: validation lowercases and trims it first.
    expectLimited(await forgot('target@example.com'), /^Too many password reset emails have been asked for this address/);
    expect((await forgot('someone-else@example.com')).status).toBe(200);
  });
});
