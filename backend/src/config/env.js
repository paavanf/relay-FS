// env.js
// The server's settings, read once from process.env and checked by
// envSchema.js. A missing or unsafe value stops the process here, before it
// listens, with a list of what to fix - never a server half-configured.

import { parseEnv } from './envSchema.js';

const result = parseEnv(process.env);

if (!result.ok) {
  const issues = result.issues.map((issue) => `  - ${issue}`).join('\n');
  console.error(`Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill it in.`);
  process.exit(1);
}

const settings = result.data;
const isProduction = settings.NODE_ENV === 'production';

export const env = Object.freeze({
  ...settings,
  isProduction,
  isDevelopment: settings.NODE_ENV === 'development',
  isTest: settings.NODE_ENV === 'test',
  // Production answers cross-origin requests from the frontend alone.
  corsOrigins: isProduction
    ? [new URL(settings.FRONTEND_URL).origin]
    : settings.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
});

export default env;
