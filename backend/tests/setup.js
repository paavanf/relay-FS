// Loaded by Vitest before every test file (see vitest.config.js).
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-not-for-production-use';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-not-for-production-use';
process.env.INTERNAL_JOB_SECRET ??= 'test-internal-job-secret-not-for-production-use';
