// testAdapter.js
// The stand-in for Supabase in the automated tests and the offline e2e
// suite: tokens signed with HS256 using AUTH_TEST_SECRET, a random value
// each test run makes up. tests/helpers/identity.js and the e2e stack sign
// them; nothing else can.
//
// It exists only under NODE_ENV=test. envSchema.js already refuses to start
// a server with AUTH_MODE=test anywhere else, and creating the adapter
// checks again, so no wiring mistake can put it in front of real users.
//
// A test token carries the same claims as a Supabase token, plus
// email_verified: false when a test wants an unproven email - the stand-in
// for a Supabase project with "Confirm email" off (emailTrust.js).

import { jwtVerify } from 'jose';
import { AppError } from '../../errors/AppError.js';
import { identityFromClaims } from './claims.js';

export const TEST_ISSUER = 'relay-test-auth';

export function testAdapter({ nodeEnv, secret }) {
  if (nodeEnv !== 'test') throw new Error('The test identity adapter only runs when NODE_ENV=test.');
  const key = new TextEncoder().encode(secret);
  const rules = { algorithms: ['HS256'], issuer: TEST_ISSUER, audience: 'authenticated', requiredClaims: ['sub', 'exp'] };

  async function resolve(token) {
    let claims;
    try {
      ({ payload: claims } = await jwtVerify(token, key, rules));
    } catch (error) {
      throw AppError.unauthorized(error?.code === 'ERR_JWT_EXPIRED' ? 'Access token expired' : 'Invalid access token');
    }
    return { ...identityFromClaims(claims), emailProven: claims.email_verified !== false };
  }

  return { resolve, emailsAreProven: async () => true };
}
