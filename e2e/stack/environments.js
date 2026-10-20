// environments.js
// The environment variables each child process of the stack starts with.
//
// Each starts from this process's environment - Windows needs PATH,
// SystemRoot and the like - and then sets everything that matters
// explicitly. The email settings are removed outright, so nothing the suite
// does can send a real email.

const EMAIL_SETTINGS = ['RESEND_API_KEY', 'EMAIL_FROM', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];

function base() {
  const env = { ...process.env };
  for (const name of EMAIL_SETTINGS) delete env[name];
  return env;
}

/**
 * Test mode: the backend behaves exactly as in development except that its
 * log is silent and the login rate limit is off - the suite signs in dozens
 * of times from one address, which is what that limit exists to stop.
 */
export function backendEnv({ mongoUri, apiPort, webOrigin, secrets }) {
  return {
    ...base(),
    NODE_ENV: 'test',
    PORT: String(apiPort),
    MONGODB_URI: mongoUri,
    JWT_ACCESS_SECRET: secrets.access,
    JWT_REFRESH_SECRET: secrets.refresh,
    CORS_ORIGIN: webOrigin,
    FRONTEND_URL: webOrigin,
  };
}

/** For prepareData.js: the in-memory database, and a silent backend logger. */
export function dataEnv(mongoUri) {
  return { ...base(), NODE_ENV: 'test', MONGODB_URI: mongoUri };
}

/**
 * For the frontend build: the public demo build. The seeded ward is the shared
 * demo organisation (the seed's fixed id), so the suite sees what a visitor
 * to the deployed demo sees - "Try the demo" on the login page included.
 */
export function buildEnv() {
  return { ...base(), VITE_DEMO_MODE: 'true' };
}

/** For vite preview: where to proxy /api (read by frontend/vite.config.js). */
export function previewEnv(apiOrigin) {
  return { ...base(), VITE_API_PROXY: apiOrigin };
}
