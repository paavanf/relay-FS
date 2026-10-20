// envSchema.js
// What the environment must hold, as Zod schemas, and parseEnv() - a pure
// function from an environment object to settings or a list of problems, so
// the rules can be tested without starting the server. env.js runs it.
//
// Outside production most values fall back to local defaults, so the API
// starts before a .env exists. Production supplies every value, and refuses
// to start when FRONTEND_URL is not https, when the two JWT secrets are
// short or the same, when INTERNAL_JOB_SECRET is missing, or when
// EMAIL_ENABLED is true with no way to send email.

import { z } from 'zod';

const secret = z.string({ required_error: 'is required' }).min(32, 'must be at least 32 characters long');
const blankIsUnset = (value) => (value === '' ? undefined : value);
const onOff = z.enum(['true', 'false']);
const hasTransport = (env) => Boolean((env.SMTP_USER && env.SMTP_PASS) || env.RESEND_API_KEY);

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(4917),
  // Cross-origin callers allowed outside production. In production the only
  // one is FRONTEND_URL's origin (env.js), whatever this says.
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: secret,
  JWT_REFRESH_SECRET: secret,

  // How many proxies stand in front of the server - see app.js. 0 trusts none.
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),

  // Email. All optional: with neither SMTP nor Resend set, links are printed
  // to the console instead (outside production), so every flow still works.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('onboarding@resend.dev'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().max(65535).default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Where links in emails point - the frontend, not the API.
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Whether this server sends email at all. Unset, production sends it only
  // when SMTP or Resend is configured; elsewhere links are printed to the
  // console, so every flow works locally. 'false' turns it off completely:
  // no transport, no password reset by email, no notification emails.
  EMAIL_ENABLED: z.preprocess(blankIsUnset, onOff.optional()),

  // A temporary check of TRUST_PROXY after a deploy: 'true' makes the health
  // endpoint also report the client address the server sees. Off by default.
  EXPOSE_CLIENT_IP: onOff.default('false').transform((value) => value === 'true'),

  // The shared secret a scheduled job sends to POST /api/v1/internal/*.
  // Optional outside production, where those endpoints then answer 503.
  INTERNAL_JOB_SECRET: z.preprocess(blankIsUnset, secret.optional()),
});

const devSchema = baseSchema.extend({
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/relay-dev'),
  JWT_ACCESS_SECRET: secret.default('dev-only-access-secret-not-for-production-use'),
  JWT_REFRESH_SECRET: secret.default('dev-only-refresh-secret-not-for-production-use'),
});

const productionSchema = baseSchema
  .extend({ INTERNAL_JOB_SECRET: z.preprocess(blankIsUnset, secret) })
  .superRefine((env, ctx) => {
    if (!env.FRONTEND_URL.startsWith('https://')) {
      ctx.addIssue({ code: 'custom', path: ['FRONTEND_URL'], message: 'must be an https:// address in production' });
    }
    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      ctx.addIssue({ code: 'custom', path: ['JWT_REFRESH_SECRET'], message: 'must be different from JWT_ACCESS_SECRET' });
    }
    if (env.EMAIL_ENABLED === 'true' && !hasTransport(env)) {
      ctx.addIssue({ code: 'custom', path: ['EMAIL_ENABLED'], message: 'is true, but no email can be sent: set SMTP_USER and SMTP_PASS, or RESEND_API_KEY' });
    }
  });

// EMAIL_ENABLED as a boolean: what was said, or else the default described above.
function emailEnabled(env) {
  if (env.EMAIL_ENABLED !== undefined) return env.EMAIL_ENABLED === 'true';
  return env.NODE_ENV === 'production' ? hasTransport(env) : true;
}

/** { ok: true, data } or { ok: false, issues: ['FRONTEND_URL: must be ...'] }. */
export function parseEnv(source) {
  const schema = source.NODE_ENV === 'production' ? productionSchema : devSchema;
  const parsed = schema.safeParse(source);
  if (parsed.success) return { ok: true, data: { ...parsed.data, EMAIL_ENABLED: emailEnabled(parsed.data) } };
  return { ok: false, issues: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) };
}
