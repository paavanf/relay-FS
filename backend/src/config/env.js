import { z } from 'zod';

const secret = z.string().min(32, 'must be at least 32 characters long');

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(4917),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: secret,
  JWT_REFRESH_SECRET: secret,

  // Email. RESEND_API_KEY is optional on purpose: without it the app still
  // starts, and password-reset links are logged to the console instead of
  // being emailed, so the flow is usable before any email setup is done.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('onboarding@resend.dev'),

  // SMTP, checked before Resend. Resend's default sender is a sandbox address
  // that only delivers to the account owner, so plain SMTP (a Gmail app
  // password, say) is the practical way to reach real recipients without
  // owning a domain. All optional: unset simply means "not this transport".
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().max(65535).default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Where links in emails should point (the frontend, not the API).
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // The shared secret a scheduled job sends to POST /api/v1/internal/*
  // (the reaper for expired swap reservations). Optional: without it those
  // endpoints refuse every request. An empty value counts as unset.
  INTERNAL_JOB_SECRET: z.preprocess((value) => (value === '' ? undefined : value), secret.optional()),
});

// Outside production we fall back to local defaults so the API boots before a
// .env exists. Production must supply every value explicitly.
const devSchema = baseSchema.extend({
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/relay-dev'),
  JWT_ACCESS_SECRET: secret.default('dev-only-access-secret-not-for-production-use'),
  JWT_REFRESH_SECRET: secret.default('dev-only-refresh-secret-not-for-production-use'),
});

const isProduction = process.env.NODE_ENV === 'production';
const parsed = (isProduction ? baseSchema : devSchema).safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill it in.`);
  process.exit(1);
}

export const env = Object.freeze({
  ...parsed.data,
  isProduction,
  isDevelopment: parsed.data.NODE_ENV === 'development',
  isTest: parsed.data.NODE_ENV === 'test',
  corsOrigins: parsed.data.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
});

export default env;
