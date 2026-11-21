// testToken.js
// Signs, in Node, the token the backend's test adapter accepts
// (backend/src/services/identity/testAdapter.js), for the helpers that call
// the API directly (api.js). The e2e build's in-browser stand-in for
// Supabase signs the same kind of token (frontend/src/lib/auth/testTokens.js)
// and gives the same email the same user id, so both name the same person.
//
// HS256, with the secret the stack made up for this run (stack().authSecret).
// Like a Supabase token it says when its session signed in (amr): now, or
// options.signedInAt (ms), which the API's 7-day limit reads.

import crypto from 'node:crypto';

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const userIdFor = (email) => `test-${crypto.createHash('sha256').update(email).digest('hex').slice(0, 32)}`;

export function signTestToken(email, secret, { signedInAt = Date.now() } = {}) {
  const address = email.trim().toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const claims = encode({
    sub: userIdFor(address),
    email: address,
    role: 'authenticated',
    is_anonymous: false,
    user_metadata: {},
    amr: [{ method: 'password', timestamp: Math.floor(signedInAt / 1000) }],
    iss: 'relay-test-auth',
    aud: 'authenticated',
    iat: now,
    exp: now + 3600,
  });
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${claims}`).digest('base64url');
  return `${header}.${claims}.${signature}`;
}
