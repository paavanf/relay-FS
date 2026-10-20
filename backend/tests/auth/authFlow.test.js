// authFlow.test.js
// Signing in: a token, the user and their memberships; a refresh cookie
// locked down and gone when the browser closes; a wrong password that does
// not reveal whether the email exists; and /me with the bearer token.
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
  it('logs in and returns a token, user, and memberships', async () => {
    const res = await request(app).post('/api/v1/auth/login').send(credentials);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.memberships).toEqual([]);
  });

  it('sets a locked-down session cookie that does not outlive the browser', async () => {
    const res = await request(app).post('/api/v1/auth/login').send(credentials);
    const cookie = res.headers['set-cookie'].join(';');

    // Security attributes: unreadable by JS, not sent cross-site, and only
    // ever sent to the auth endpoints.
    expect(cookie).toContain('relay_refresh=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/api/v1/auth');

    // No Max-Age/Expires: the browser discards it on close. Closing just the
    // tab is handled on the frontend by the per-tab sessionStorage marker.
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
});
