// authFlow.test.js
// Walks the whole session lifecycle the frontend depends on:
// register -> login -> /me -> refresh -> logout.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';

let app;

const credentials = { email: 'flow@example.com', password: 'password123' };

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Flow User', ...credentials });
});

describe('auth flow', () => {
  it('logs in and returns a token, user, and memberships', async () => {
    const res = await request(app).post('/api/v1/auth/login').send(credentials);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.memberships).toEqual([]);
  });

  it('sets the refresh cookie as a session cookie, not a persistent one', async () => {
    const res = await request(app).post('/api/v1/auth/login').send(credentials);
    const cookie = res.headers['set-cookie'].join(';');

    // Security attributes must stay put.
    expect(cookie).toContain('relay_refresh=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/api/v1/auth');

    // No Max-Age or Expires means the browser drops it when it closes, so a
    // shared machine does not hand the next person a live session.
    expect(cookie).not.toContain('Max-Age');
    expect(cookie).not.toContain('Expires');
  });

  it('rejects a wrong password without revealing whether the email exists', async () => {
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: 'wrongpassword1' });

    const unknownEmail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    // Identical message: otherwise the difference leaks which emails exist.
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });

  it('returns the current user from /me with a bearer token', async () => {
    const login = await request(app).post('/api/v1/auth/login').send(credentials);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

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
