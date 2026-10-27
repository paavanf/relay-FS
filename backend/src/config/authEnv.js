// authEnv.js
// The sign-in settings in the environment, kept apart from envSchema.js so
// each file stays small. envSchema.js adds these fields to its schema, runs
// checkAuthEnv on every environment, and adds serverMustNotHold's findings.
//
//   AUTH_MODE                 'supabase' - always, outside the tests - or 'test'
//   SUPABASE_URL              the project's URL, https://<ref>.supabase.co
//   SUPABASE_PUBLISHABLE_KEY  the project's public key (the legacy anon key works too)
//   SUPABASE_WEBHOOK_SECRET   optional: switches on POST /webhooks/supabase-auth
//   AUTH_TEST_SECRET          test runs only: what test tokens are signed with
//
// The server refuses to start with AUTH_MODE=test anywhere but NODE_ENV=test,
// so the offline test sign-in can never stand in front of real users. It
// also refuses a secret key where the publishable one belongs, and - in
// production - a service role key anywhere in its environment: that key can
// do anything to every account, and lives only in GitHub Actions and on your
// own machine, for the demo seed.

import { z } from 'zod';

const blankIsUnset = (value) => (value === '' ? undefined : value);
const longSecret = z.string().min(32, 'must be at least 32 characters long');
const optional = (schema) => z.preprocess(blankIsUnset, schema.optional());
const isLocalhost = (url) => ['localhost', '127.0.0.1'].includes(url.hostname);

export const authFields = {
  AUTH_MODE: z.enum(['supabase', 'test']).default('supabase'),
  SUPABASE_URL: optional(z.string().url().transform((value) => value.replace(/\/+$/, ''))),
  SUPABASE_PUBLISHABLE_KEY: optional(z.string()),
  SUPABASE_WEBHOOK_SECRET: optional(longSecret),
  AUTH_TEST_SECRET: optional(longSecret),
};

/** A Supabase key that must never leave the server side: sb_secret_..., or a legacy service_role JWT. */
export function isSecretKey(value) {
  if (typeof value !== 'string') return false;
  if (value.startsWith('sb_secret_')) return true;
  try {
    const payload = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString('utf8'));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

export function checkAuthEnv(env, ctx) {
  const problem = (path, message) => ctx.addIssue({ code: 'custom', path: [path], message });

  if (env.AUTH_MODE === 'test') {
    if (env.NODE_ENV !== 'test') problem('AUTH_MODE', 'test sign-in is only allowed when NODE_ENV=test');
    if (!env.AUTH_TEST_SECRET) problem('AUTH_TEST_SECRET', 'is required when AUTH_MODE=test');
    return;
  }

  if (!env.SUPABASE_URL) {
    problem('SUPABASE_URL', "is required - your Supabase project's URL");
  } else {
    const url = new URL(env.SUPABASE_URL);
    if (url.protocol !== 'https:' && !isLocalhost(url)) problem('SUPABASE_URL', 'must be an https:// address');
  }

  if (!env.SUPABASE_PUBLISHABLE_KEY) {
    problem('SUPABASE_PUBLISHABLE_KEY', "is required - the project's publishable key");
  } else if (isSecretKey(env.SUPABASE_PUBLISHABLE_KEY)) {
    problem('SUPABASE_PUBLISHABLE_KEY', 'is a secret key - the server needs only the publishable one');
  }
}

/** Problems with the raw environment itself, before parsing - a list like parseEnv's. */
export function serverMustNotHold(source) {
  if (source.NODE_ENV === 'production' && source.SUPABASE_SERVICE_ROLE_KEY) {
    return ['SUPABASE_SERVICE_ROLE_KEY: must not be set on the server - it belongs only in GitHub Actions secrets and your local .env'];
  }
  return [];
}
