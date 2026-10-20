// authSession.test.js
// After signing in: /me needs a token, the refresh cookie issues a fresh
// access token (and nothing without it), logging out stops it working, and
// logging out twice is harmless.
//
// Together with authSession.test.js, the whole session lifecycle the
// frontend depends on: register -> login -> /me -> refresh -> logout. Every
// test starts with one registered user.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { useEmptyDb } from '../helpers/apiTest.js';

const world = useEmptyDb(async (app) => {
  await request(app).post('/api/v1/auth/register').send({ name: 'Flow User', ...credentials });
});
let app;
beforeEach(() => ({ app } = world));

const credentials = { email: 'flow@example.com', password: 'password123' };

describe('auth flow', () => {
  it('rejects /me without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('issues a fresh access token from the refresh cookie', async () => {
    const login = await request(app).post('/api/v1/auth/login').send(credentials);
    const cookie = login.headers['set-cookie'];

    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('refuses to refresh without a cookie', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('stops the refresh token working after logout', async () => {
    const login = await request(app).post('/api/v1/auth/login').send(credentials);
    const cookie = login.headers['set-cookie'];

    const loggedOut = await request(app).post('/api/v1/auth/logout').set('Cookie', cookie);
    expect(loggedOut.status).toBe(200);

    // The revoked token must not be usable afterwards.
    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(401);
  });

  it('treats logout as idempotent when no session exists', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
  });
});
