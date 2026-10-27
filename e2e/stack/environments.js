// environments.js
// The environment variables each child process of the stack starts with.
//
// Each starts from this process's environment - Windows needs PATH,
// SystemRoot and the like - and then sets everything that matters
// explicitly. The email settings are removed outright, so nothing the suite
// does can send a real email - and so are the Supabase ones, so nothing can
// reach a real Supabase project: sign-in is the offline stand-in.

import crypto from 'node:crypto';

const EMAIL_SETTINGS = ['RESEND_API_KEY', 'EMAIL_FROM', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
const SUPABASE_SETTINGS = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_WEBHOOK_SECRET'];

function base() {
  const env = { ...process.env };
  for (const name of [...EMAIL_SETTINGS, ...SUPABASE_SETTINGS]) delete env[name];
  return env;
}

/**
 * Test mode: the backend behaves exactly as in development except that its
 * log is silent, its rate limits are off - the suite signs in dozens of times
 * from one address - and sign-in is the offline stand-in for Supabase: tokens
 * signed with authSecret, made up afresh for each build (steps.js).
 */
export function backendEnv({ mongoUri, apiPort, webOrigin, authSecret }) {
  return {
    ...base(),
    NODE_ENV: 'test',
    PORT: String(apiPort),
    MONGODB_URI: mongoUri,
    AUTH_MODE: 'test',
    AUTH_TEST_SECRET: authSecret,
    CORS_ORIGIN: webOrigin,
    FRONTEND_URL: webOrigin,
  };
}

/**
 * For prepareData.js: the in-memory database, and a silent backend logger.
 * It signs nobody in, but the backend's settings must still name a sign-in:
 * the offline one, with a secret used for nothing.
 */
export function dataEnv(mongoUri) {
  const unused = crypto.randomBytes(32).toString('hex');
  return { ...base(), NODE_ENV: 'test', MONGODB_URI: mongoUri, AUTH_MODE: 'test', AUTH_TEST_SECRET: unused };
}

/**
 * For the frontend build: the public demo build. The seeded ward is the shared
 * demo organisation (the seed's fixed id), so the suite sees what a visitor
 * to the deployed demo sees - "Try the demo" on the login page included.
 * Sign-in is the in-browser stand-in for Supabase, signing with authSecret;
 * built in the e2e mode, since a production build refuses it.
 */
export function buildEnv(authSecret) {
  return { ...base(), VITE_DEMO_MODE: 'true', VITE_AUTH_MODE: 'test', VITE_AUTH_TEST_SECRET: authSecret };
}

/** For vite preview: where to proxy /api (read by frontend/vite.config.js). */
export function previewEnv(apiOrigin) {
  return { ...base(), VITE_API_PROXY: apiOrigin };
}
