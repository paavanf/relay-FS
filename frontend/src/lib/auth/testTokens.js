// testTokens.js
// The tokens the offline stand-in (testAuthClient.js) signs, in the e2e
// build only: the claims a Supabase access token carries, signed with
// HS256 and VITE_AUTH_TEST_SECRET - what the backend's test adapter checks
// (backend/src/services/identity/testAdapter.js).
//
// The same email always gets the same user id, worked out the way the
// backend's tests/helpers/identity.js and e2e/support/api.js work it out,
// so every way the suite signs someone in names the same person.

import { SignJWT } from 'jose';

const bytes = (text) => new TextEncoder().encode(text);

async function userIdFor(email) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes(email)));
  const hex = [...hash].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `test-${hex.slice(0, 32)}`;
}

export async function signTestToken(email) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ email, role: 'authenticated', is_anonymous: false, user_metadata: {} })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('relay-test-auth')
    .setAudience('authenticated')
    .setSubject(await userIdFor(email))
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(bytes(import.meta.env.VITE_AUTH_TEST_SECRET));
}
