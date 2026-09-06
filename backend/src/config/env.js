import { z } from 'zod';

const secret = z.string().min(32, 'must be at least 32 characters long');

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(4917),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: secret,
  JWT_REFRESH_SECRET: secret,
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
