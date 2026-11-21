// envGuard.test.js
// The builds vite.config.js refuses (config/envGuard.js): a secret key in any
// VITE_ variable, in any build; the offline test sign-in in a production
// build; and, on Vercel, a build with nowhere to sign in.

import { describe, it, expect } from 'vitest';
import { buildEnvProblems } from './envGuard.js';

const SUPABASE = { VITE_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' };
const TEST_SIGN_IN = { VITE_AUTH_MODE: 'test', VITE_AUTH_TEST_SECRET: 'x'.repeat(64) };
const serviceRoleJwt = ['e30', Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url'), 'sig'].join('.');
const local = { mode: 'production', onVercel: false };

describe('the build guard', () => {
  it('passes a production build with only public settings', () => {
    expect(buildEnvProblems({ ...SUPABASE, VITE_DEMO_MODE: 'true' }, local)).toEqual([]);
    expect(buildEnvProblems({ ...SUPABASE }, { mode: 'production', onVercel: true })).toEqual([]);
  });

  it('refuses a service role or secret key in any build, e2e included', () => {
    const env = { ...SUPABASE, VITE_SUPABASE_SERVICE_ROLE_KEY: 'anything', VITE_KEY: 'sb_secret_abc', VITE_OLD: serviceRoleJwt };
    expect(buildEnvProblems(env, { mode: 'e2e', onVercel: false })).toEqual([
      'VITE_SUPABASE_SERVICE_ROLE_KEY: a service role key never goes in the frontend',
      'VITE_KEY: holds a secret key, which never goes in the frontend',
      'VITE_OLD: holds a secret key, which never goes in the frontend',
    ]);
  });

  it('refuses the offline test sign-in in a production build, or on Vercel in any mode', () => {
    const refusals = [
      'VITE_AUTH_MODE: the offline test sign-in is for the e2e build only',
      'VITE_AUTH_TEST_SECRET: belongs to the e2e build only',
    ];
    expect(buildEnvProblems({ ...SUPABASE, ...TEST_SIGN_IN }, local)).toEqual(refusals);
    expect(buildEnvProblems({ ...SUPABASE, ...TEST_SIGN_IN }, { mode: 'e2e', onVercel: true })).toEqual(refusals);
  });

  it('allows the offline test sign-in in the e2e build, off Vercel', () => {
    expect(buildEnvProblems(TEST_SIGN_IN, { mode: 'e2e', onVercel: false })).toEqual([]);
  });

  it('refuses a Vercel build with nowhere to sign in', () => {
    expect(buildEnvProblems({}, { mode: 'production', onVercel: true })).toEqual([
      'VITE_SUPABASE_URL: is required, or nobody could sign in',
      'VITE_SUPABASE_PUBLISHABLE_KEY: is required, or nobody could sign in',
    ]);
  });
});
