// databaseDown.test.js
// With the database gone, the API still answers - it does not hang. The
// health check says 503 at once, and a request that needs the database gets
// a 500 in the API's error shape. A dropped connection fails at once; a
// server that stops answering is given up on after the 10-second server
// selection timeout (config/db.js). What a 500 may say in production is
// pinned by ../security/productionErrors.test.js: only "Internal server error".

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { startTestDb, stopTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { auth, signUp } from '../helpers/orgBuilder.js';

let app;
let token;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
  token = await signUp(app, 'Dee Down', 'dee@example.com');
  await mongoose.disconnect();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

describe('when the database is down', () => {
  it('says so at once on the health check: 503, degraded', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
  });

  it('answers a request that needs it with a 500, within seconds, instead of hanging', async () => {
    const started = Date.now();
    const res = await request(app).get('/api/v1/auth/me').set(auth(token));
    const seconds = (Date.now() - started) / 1000;

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(seconds).toBeLessThan(15);
  }, 30_000);
});
