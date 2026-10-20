// trustProxy.test.js
// The per-address limits count by req.ip, which is only the visitor's real
// address when 'trust proxy' (TRUST_PROXY) matches the proxies in front of
// the server - app.js explains the setting. Checked with the registration
// limit, the tightest per-address one:
//
//   trust proxy 1   two visitors behind the same proxy are counted apart, by
//                   the address the proxy wrote into X-Forwarded-For
//   trust proxy off the header is ignored - writing your own address into it
//                   does not buy a fresh count

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { limitsInTests } from '../../src/middleware/rateLimiters.js';
import { REGISTRATION_LIMIT } from '../../src/config/constants.js';

let behindProxy;
let direct;
let n = 0;

beforeAll(async () => {
  await startTestDb();
  behindProxy = createApp();
  behindProxy.set('trust proxy', 1);
  direct = createApp();
  limitsInTests.on = true;
}, 120_000);
afterAll(async () => {
  limitsInTests.on = false;
  await stopTestDb();
});

const register = (app, forwardedFor) => {
  n += 1;
  return request(app)
    .post('/api/v1/auth/register')
    .set('X-Forwarded-For', forwardedFor)
    .send({ name: 'New Person', email: `person${n}@example.com`, password: 'password123' });
};

async function useUp(app, forwardedFor) {
  for (let i = 0; i < REGISTRATION_LIMIT.max; i += 1) expect((await register(app, forwardedFor)).status).toBe(201);
  return register(app, forwardedFor);
}

describe('rate limits and the client address', () => {
  it('behind one trusted proxy, counts each visitor by the address the proxy reports', async () => {
    expect((await useUp(behindProxy, '203.0.113.7')).status).toBe(429);
    expect((await register(behindProxy, '198.51.100.23')).status).toBe(201);
  });

  it('with no proxy trusted, ignores the header, so a forged address gets no fresh count', async () => {
    expect((await useUp(direct, '192.0.2.1')).status).toBe(429);
    expect((await register(direct, '192.0.2.99')).status).toBe(429);
  });
});
