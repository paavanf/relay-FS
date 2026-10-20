// passwords.test.js
// Passwords are hashed with the OWASP Password Storage Cheat Sheet's Argon2id
// settings - 19 MiB, 2 iterations, parallelism 1 (src/utils/passwords.js) -
// and every hash made before, with the library's defaults (64 MiB, 3
// iterations, parallelism 4), still verifies, because Argon2 keeps its
// settings inside each hash. Proved on the functions, and on sign-in itself
// for an account whose stored hash is an old one.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import argon2 from 'argon2';
import request from 'supertest';
import { startTestDb, stopTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/index.js';
import { hashPassword, verifyPassword } from '../../src/utils/passwords.js';

// How every password was hashed before: the library's defaults, spelled out.
const OLD_SETTINGS = { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 };
const NEW_PREFIX = /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/;

let app;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);
afterAll(stopTestDb);

describe('password hashing', () => {
  it('hashes with the OWASP settings, and checks a password against the hash', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(hash).toMatch(NEW_PREFIX);
    expect(await verifyPassword(hash, 'correct horse battery')).toBe(true);
    expect(await verifyPassword(hash, 'wrong horse battery')).toBe(false);
  });

  it('still verifies a hash made with the old settings', async () => {
    const old = await argon2.hash('correct horse battery', OLD_SETTINGS);
    expect(old).toMatch(/^\$argon2id\$v=19\$m=65536,t=3,p=4\$/);
    expect(await verifyPassword(old, 'correct horse battery')).toBe(true);
    expect(await verifyPassword(old, 'wrong horse battery')).toBe(false);
  });

  it('lets an account whose stored hash is old sign in - with its own password only', async () => {
    await User.create({ name: 'Early Bird', email: 'early@example.com', passwordHash: await argon2.hash('password123', OLD_SETTINGS) });
    const signIn = (password) => request(app).post('/api/v1/auth/login').send({ email: 'early@example.com', password });
    expect((await signIn('password123')).status).toBe(200);
    expect((await signIn('password124')).status).toBe(401);
  });

  it('stores a new account with the OWASP settings', async () => {
    await request(app).post('/api/v1/auth/register').send({ name: 'New Person', email: 'new@example.com', password: 'password123' });
    expect((await User.findOne({ email: 'new@example.com' })).passwordHash).toMatch(NEW_PREFIX);
  });
});
