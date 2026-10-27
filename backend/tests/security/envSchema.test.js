// envSchema.test.js
// The server refuses to start in production with settings that would make it
// unsafe (config/envSchema.js): FRONTEND_URL not https, no
// INTERNAL_JOB_SECRET. Outside production it starts on defaults. The sign-in
// settings have tests of their own (authEnv.test.js).

import { describe, it, expect } from 'vitest';
import { parseEnv } from '../../src/config/envSchema.js';
import { PRODUCTION_AUTH_ENV } from '../helpers/productionEnv.js';

const production = (changes = {}) => ({
  NODE_ENV: 'production',
  MONGODB_URI: 'mongodb://db.example.com:27017/relay',
  FRONTEND_URL: 'https://relay.example.com',
  INTERNAL_JOB_SECRET: 'c'.repeat(40),
  ...PRODUCTION_AUTH_ENV,
  ...changes,
});

const problems = (source) => parseEnv(source).issues ?? [];

describe('production environment checks', () => {
  it('starts with a complete, safe production environment', () => {
    expect(parseEnv(production())).toMatchObject({ ok: true, data: { TRUST_PROXY: 0 } });
  });

  it('refuses a FRONTEND_URL that is not https', () => {
    expect(problems(production({ FRONTEND_URL: 'http://relay.example.com' }))).toEqual([
      'FRONTEND_URL: must be an https:// address in production',
    ]);
  });

  it('refuses a missing INTERNAL_JOB_SECRET - and a blank one counts as missing', () => {
    expect(problems(production({ INTERNAL_JOB_SECRET: undefined }))).toEqual(['INTERNAL_JOB_SECRET: is required']);
    expect(problems(production({ INTERNAL_JOB_SECRET: '' }))).toEqual(['INTERNAL_JOB_SECRET: is required']);
  });

  it('outside production, starts on local defaults with no proxy trusted - given where people sign in', () => {
    expect(parseEnv({ NODE_ENV: 'development', ...PRODUCTION_AUTH_ENV })).toMatchObject({
      ok: true,
      data: { TRUST_PROXY: 0, FRONTEND_URL: 'http://localhost:5173' },
    });
  });

  it('reads TRUST_PROXY as a number of proxies, and refuses anything else', () => {
    expect(parseEnv(production({ TRUST_PROXY: '2' })).data.TRUST_PROXY).toBe(2);
    expect(parseEnv(production({ TRUST_PROXY: 'true' })).ok).toBe(false);
  });
});
