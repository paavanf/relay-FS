// clientAddress.test.js
// EXPOSE_CLIENT_IP=true - a check to run for a few minutes after a deploy -
// makes GET /api/v1/health also say which client address the server settled
// on, and how many addresses X-Forwarded-For held, so TRUST_PROXY can be
// confirmed (docs/deploy/DEPLOY.md). Off, the answer holds neither.
//
// With TRUST_PROXY=2 - Vercel's edge, then Render's proxy - the chains the
// deployment produces resolve to the visitor; a made-up first entry is
// passed over; and a request sent straight to the API host, past Vercel, can
// choose its own address, which is the documented limit of any proxy count.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb } from '../helpers/db.js';

// The settings are read once, when the app is first imported.
async function appWith(settings) {
  vi.resetModules();
  Object.assign(process.env, settings);
  const { createApp } = await import('../../src/app.js');
  return createApp();
}

let exposed;
let hidden;

beforeAll(async () => {
  await startTestDb();
  hidden = await appWith({ TRUST_PROXY: '2', EXPOSE_CLIENT_IP: 'false' });
  exposed = await appWith({ TRUST_PROXY: '2', EXPOSE_CLIENT_IP: 'true' });
}, 120_000);
afterAll(async () => {
  delete process.env.TRUST_PROXY;
  delete process.env.EXPOSE_CLIENT_IP;
  await stopTestDb();
});

const health = (app, forwardedFor) => {
  const req = request(app).get('/api/v1/health');
  return (forwardedFor ? req.set('X-Forwarded-For', forwardedFor) : req).then((res) => res.body);
};

describe('the client address on the health check', () => {
  it('is not shown unless EXPOSE_CLIENT_IP is true', async () => {
    const body = await health(hidden, '203.0.113.7, 198.51.100.20');
    expect(body.status).toBe('ok');
    expect(body).not.toHaveProperty('clientIp');
    expect(body).not.toHaveProperty('forwardedHops');
  });

  it('through Vercel and Render, is the visitor - whatever they wrote in front of it', async () => {
    expect(await health(exposed, '203.0.113.7, 198.51.100.20')).toMatchObject({ clientIp: '203.0.113.7', forwardedHops: 2 });
    expect(await health(exposed, '192.0.2.66, 203.0.113.7, 198.51.100.20')).toMatchObject({ clientIp: '203.0.113.7', forwardedHops: 3 });
  });

  it('with no proxy in the way, is the connection itself', async () => {
    const body = await health(exposed);
    expect(body.clientIp).toMatch(/127\.0\.0\.1$/);
    expect(body.forwardedHops).toBe(0);
  });

  it('sent straight to the API host, past Vercel, is whatever the sender wrote first', async () => {
    expect(await health(exposed, '192.0.2.66, 203.0.113.7')).toMatchObject({ clientIp: '192.0.2.66', forwardedHops: 2 });
  });
});
