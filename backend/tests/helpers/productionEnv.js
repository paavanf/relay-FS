// productionEnv.js
// Production-shaped settings for the tests that load the app the way a
// production server would: every required value present and safe, so it
// starts - and no email transport, as on the deployed demo.

export const PRODUCTION_ENV = Object.freeze({
  NODE_ENV: 'production',
  MONGODB_URI: 'mongodb://db.example.com:27017/relay',
  JWT_ACCESS_SECRET: 'a'.repeat(40),
  JWT_REFRESH_SECRET: 'b'.repeat(40),
  FRONTEND_URL: 'https://relay.example.com',
  INTERNAL_JOB_SECRET: 'c'.repeat(40),
});
