// trustProxy.test.js
// The per-address limits count by req.ip, which is only the visitor's real
// address when 'trust proxy' (TRUST_PROXY) matches the proxies in front of
// the server - app.js explains the setting. Checked with the webhook's
// limit, the tightest per-address one Relay counts itself (sign-up and
// sign-in are limited by Supabase). The webhook is not configured here, so
// each call is a 404 until the limit turns it into a 429:
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
import { WEBHOOK_LIMIT } from '../../src/config/constants.js';

let behindProxy;
let direct;

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

const call = (app, forwardedFor) =>
  request(app).post('/api/v1/webhooks/supabase-auth').set('X-Forwarded-For', forwardedFor).send({});

async function useUp(app, forwardedFor) {
  for (let i = 0; i < WEBHOOK_LIMIT.max; i += 1) expect((await call(app, forwardedFor)).status).toBe(404);
  return call(app, forwardedFor);
}

describe('rate limits and the client address', () => {
  it('behind one trusted proxy, counts each visitor by the address the proxy reports', async () => {
    expect((await useUp(behindProxy, '203.0.113.7')).status).toBe(429);
    expect((await call(behindProxy, '198.51.100.23')).status).toBe(404);
  });

  it('with no proxy trusted, ignores the header, so a forged address gets no fresh count', async () => {
    expect((await useUp(direct, '192.0.2.1')).status).toBe(429);
    expect((await call(direct, '192.0.2.99')).status).toBe(429);
  });
});
