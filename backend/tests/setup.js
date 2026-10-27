// Loaded by Vitest before every test file (see vitest.config.js).
import crypto from 'node:crypto';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-not-for-production-use';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-not-for-production-use';
process.env.INTERNAL_JOB_SECRET ??= 'test-internal-job-secret-not-for-production-use';

// Sign-in is the offline stand-in for Supabase (services/identity/testAdapter.js).
// Its tokens are signed with a secret made up afresh for every run
// (tests/helpers/identity.js signs them).
process.env.AUTH_MODE ??= 'test';
process.env.AUTH_TEST_SECRET ??= crypto.randomBytes(32).toString('hex');
