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

afterAll(stopTestDb);

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

  it('does NOT sign the new user in - they must log in themselves', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: 'session@example.com',
      password: 'password123',
    });

    expect(res.body.message).toBe('Account created successfully');

    // No session is started: no access token, and no refresh cookie.
    expect(res.body.accessToken).toBeUndefined();
    expect(res.headers['set-cookie']).toBeUndefined();
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
