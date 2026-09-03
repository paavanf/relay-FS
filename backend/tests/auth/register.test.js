// register.test.js
// Tests that user registration works and enforces email uniqueness.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';

let app;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

describe('POST /api/v1/auth/register', () => {
  it('creates a new user account', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.id).toBeDefined();
  });

  it('signs the new user in, so the frontend gets a usable session', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: 'session@example.com',
      password: 'password123',
    });

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.memberships).toEqual([]);

    // The refresh cookie must be httpOnly and scoped to the auth endpoints.
    const cookie = res.headers['set-cookie']?.join(';') ?? '';
    expect(cookie).toContain('relay_refresh=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/api/v1/auth');
  });

  it('never returns the password hash', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: 'hash@example.com',
      password: 'password123',
    });

    expect(JSON.stringify(res.body)).not.toContain('argon2');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('normalises the email so casing cannot create duplicates', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test User', email: 'Mixed@Example.COM', password: 'password123' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test User', email: 'mixed@example.com', password: 'password123' });

    expect(res.status).toBe(409);
  });

  it('rejects duplicate emails', async () => {
    const payload = {
      name: 'Test User',
      email: 'dupe@example.com',
      password: 'password123',
    };

    await request(app).post('/api/v1/auth/register').send(payload);
    const res = await request(app).post('/api/v1/auth/register').send(payload);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects weak passwords', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: 'weak@example.com',
      password: 'short',
    });

    // 422, not 400: the existing validate middleware maps Zod failures to
    // AppError.validation, which is VALIDATION_FAILED / 422.
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });
});
