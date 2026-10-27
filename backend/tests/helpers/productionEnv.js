// productionEnv.js
// Production-shaped settings for the tests that load the app the way a
// production server would: every required value present and safe, so it
// starts - and no email transport, as on the deployed demo.
//
// Sign-in is Supabase, as in production. A test that signs anyone in points
// SUPABASE_URL at a local stand-in instead (helpers/fakeSupabase.js).

export const PRODUCTION_AUTH_ENV = Object.freeze({
  AUTH_MODE: 'supabase',
  SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test-only-key',
});

export const PRODUCTION_ENV = Object.freeze({
  NODE_ENV: 'production',
  MONGODB_URI: 'mongodb://db.example.com:27017/relay',
  JWT_ACCESS_SECRET: 'a'.repeat(40),
  JWT_REFRESH_SECRET: 'b'.repeat(40),
  FRONTEND_URL: 'https://relay.example.com',
  INTERNAL_JOB_SECRET: 'c'.repeat(40),
  ...PRODUCTION_AUTH_ENV,
});
