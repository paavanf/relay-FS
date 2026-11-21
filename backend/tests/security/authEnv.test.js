// authEnv.test.js
// The sign-in settings the server refuses to start with (config/authEnv.js):
//   - the offline test sign-in anywhere but NODE_ENV=test
//   - no Supabase URL or publishable key; an http:// URL off this machine
//   - a secret key where the publishable key belongs
//   - in production, a service role key anywhere in the environment

import { describe, it, expect } from 'vitest';
import { parseEnv } from '../../src/config/envSchema.js';
import { PRODUCTION_ENV } from '../helpers/productionEnv.js';

const problems = (source) => parseEnv(source).issues ?? [];
const dev = (changes = {}) => ({ ...PRODUCTION_ENV, NODE_ENV: 'development', ...changes });
const serviceRoleJwt = ['e30', Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url'), 'sig'].join('.');

describe('sign-in settings', () => {
  it('refuses the test sign-in in production and in development', () => {
    const testSignIn = { AUTH_MODE: 'test', AUTH_TEST_SECRET: 'x'.repeat(40) };
    expect(problems({ ...PRODUCTION_ENV, ...testSignIn })).toContain('AUTH_MODE: test sign-in is only allowed when NODE_ENV=test');
    expect(problems(dev(testSignIn))).toContain('AUTH_MODE: test sign-in is only allowed when NODE_ENV=test');
  });

  it('allows the test sign-in in tests, with a secret to sign its tokens', () => {
    expect(parseEnv({ NODE_ENV: 'test', AUTH_MODE: 'test', AUTH_TEST_SECRET: 'x'.repeat(40) }).ok).toBe(true);
    expect(problems({ NODE_ENV: 'test', AUTH_MODE: 'test' })).toContain('AUTH_TEST_SECRET: is required when AUTH_MODE=test');
  });

  it('needs the Supabase URL and publishable key, over https unless on this machine', () => {
    expect(problems(dev({ SUPABASE_URL: '', SUPABASE_PUBLISHABLE_KEY: '' }))).toEqual([
      "SUPABASE_URL: is required - your Supabase project's URL",
      "SUPABASE_PUBLISHABLE_KEY: is required - the project's publishable key",
    ]);
    expect(problems(dev({ SUPABASE_URL: 'http://abcdefghijklmnopqrst.supabase.co' }))).toEqual(['SUPABASE_URL: must be an https:// address']);
    expect(parseEnv(dev({ SUPABASE_URL: 'http://127.0.0.1:54321' })).ok).toBe(true);
    expect(parseEnv(dev({ SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co/' })).data.SUPABASE_URL).toBe(
      'https://abcdefghijklmnopqrst.supabase.co',
    );
  });

  it('refuses a secret key where the publishable key belongs', () => {
    for (const key of ['sb_secret_abc123', serviceRoleJwt]) {
      expect(problems(dev({ SUPABASE_PUBLISHABLE_KEY: key }))).toEqual([
        'SUPABASE_PUBLISHABLE_KEY: is a secret key - the server needs only the publishable one',
      ]);
    }
  });

  it('refuses a service role key in a production server, but not on a laptop running the demo seed', () => {
    expect(problems({ ...PRODUCTION_ENV, SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_abc123' })).toEqual([
      'SUPABASE_SERVICE_ROLE_KEY: must not be set on the server - it belongs only in GitHub Actions secrets and your local .env',
    ]);
    expect(parseEnv(dev({ SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_abc123' })).ok).toBe(true);
  });
});
