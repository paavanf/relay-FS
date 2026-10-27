// identity.js
// Test sign-in. Signs the tokens the test identity adapter accepts
// (src/services/identity/testAdapter.js): the claims a Supabase access token
// carries, signed with this run's AUTH_TEST_SECRET (tests/setup.js).
//
//   tokenFor({ email, name })                   someone signed in; the first
//                                               request with it creates (or
//                                               links) their Relay user
//   tokenFor({ email, emailVerified: false })   an email nobody confirmed
//   tokenFor({ email, sub })                    a chosen Supabase user id
//   tokenFor({ email, expiresIn: -60 })         an expired token
//
// The same email - in any case - always gets the same Supabase user id
// (subFor), so two tokens for one address are one person, as two sign-ins
// would be. The e2e suite and its in-browser stand-in work it out the same way.

import crypto from 'node:crypto';
import { SignJWT } from 'jose';
import { TEST_ISSUER } from '../../src/services/identity/testAdapter.js';

export const auth = (token) => ({ Authorization: `Bearer ${token}` });

export const subFor = (email) =>
  `test-${crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 32)}`;

export async function tokenFor({ email, name, sub = subFor(email), emailVerified, expiresIn = 3600, claims = {} }) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { email, role: 'authenticated', is_anonymous: false, user_metadata: name ? { name } : {}, ...claims };
  if (emailVerified === false) payload.email_verified = false;

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(TEST_ISSUER)
    .setAudience('authenticated')
    .setSubject(sub)
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .sign(new TextEncoder().encode(process.env.AUTH_TEST_SECRET));
}
