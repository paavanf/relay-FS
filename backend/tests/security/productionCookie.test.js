// productionCookie.test.js
// The refresh cookie, as a production server sets it at login: HttpOnly,
// Secure, SameSite=Strict, only ever sent to /api/v1/auth, and host-only -
// no Domain attribute, so no other subdomain ever receives it. Logging out
// clears it with the same attributes.
//
// Production settings are put in place before the app is loaded; the request
// log is silenced, since production logs every request.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import pino from 'pino';
import { startTestDb, stopTestDb } from '../helpers/db.js';

vi.mock('../../src/utils/logger.js', () => ({ logger: pino({ level: 'silent' }) }));

let app;

beforeAll(async () => {
  Object.assign(process.env, {
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb://db.example.com:27017/relay',
    JWT_ACCESS_SECRET: 'a'.repeat(40),
    JWT_REFRESH_SECRET: 'b'.repeat(40),
    FRONTEND_URL: 'https://relay.example.com',
    INTERNAL_JOB_SECRET: 'c'.repeat(40),
  });
  await startTestDb();
  const { createApp } = await import('../../src/app.js');
  app = createApp();
}, 120_000);
afterAll(stopTestDb);

const attributesOf = (setCookie) => setCookie.split(';').map((part) => part.trim().split('=')[0].toLowerCase());

describe('the refresh cookie in production', () => {
  it('is HttpOnly, Secure, SameSite=Strict, scoped to /api/v1/auth, and host-only', async () => {
    const person = { name: 'Kim Cole', email: 'kim@example.com', password: 'password123' };
    expect((await request(app).post('/api/v1/auth/register').send(person)).status).toBe(201);
    const login = await request(app).post('/api/v1/auth/login').send({ email: person.email, password: person.password });

    const [cookie] = login.headers['set-cookie'];
    expect(cookie).toMatch(/^relay_refresh=[^;]+; Path=\/api\/v1\/auth; HttpOnly; Secure; SameSite=Strict$/);
    expect(attributesOf(cookie)).not.toContain('domain');

    const logout = await request(app).post('/api/v1/auth/logout').set('Cookie', cookie.split(';')[0]);
    expect(logout.headers['set-cookie'][0]).toMatch(/^relay_refresh=; Path=\/api\/v1\/auth; Expires=.+; HttpOnly; Secure; SameSite=Strict$/);
  });
});
