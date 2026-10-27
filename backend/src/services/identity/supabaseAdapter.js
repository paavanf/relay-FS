// supabaseAdapter.js
// Checks a Supabase access token without asking Supabase about it: the
// signature against the project's public keys (its JWKS, fetched once and
// cached), then who issued it, who it is for, and when it expires.
//
//   algorithm  ES256 or RS256 only - the asymmetric keys new projects sign
//              with. "none", HS256 and anything else are refused.
//   issuer     https://<ref>.supabase.co/auth/v1
//   audience   authenticated - a signed-in user, never the anon key
//
// Keys are cached for 10 minutes, and a token signed with a key not seen yet
// makes jose fetch them again (at most every 30 seconds), so a key rotation
// needs no restart. If the keys cannot be fetched the answer is 503, not
// 401: a 401 tells the browser its session is over, and an outage at
// Supabase must not sign everyone out.
//
// `keys` and `emailsAreProven` can be passed in, so the tests run offline.

import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';
import { identityFromClaims } from './claims.js';
import { createEmailTrust } from './emailTrust.js';

// jose's codes for "could not get the keys", as opposed to "a bad token".
const KEYS_UNAVAILABLE = new Set(['ERR_JWKS_TIMEOUT', 'ERR_JWKS_INVALID', 'ERR_JOSE_GENERIC']);

function remoteKeys(url, publishableKey) {
  return createRemoteJWKSet(new URL(`${url}/auth/v1/.well-known/jwks.json`), {
    cacheMaxAge: 10 * 60_000,
    cooldownDuration: 30_000,
    timeoutDuration: 5_000,
    headers: { apikey: publishableKey },
  });
}

function refusal(error) {
  // No jose code at all means the fetch itself failed (offline, DNS, reset).
  if (!String(error?.code).startsWith('ERR_') || KEYS_UNAVAILABLE.has(error.code)) {
    return new AppError('Sign-in is unavailable right now. Try again in a moment.', 503, {
      code: ERROR_CODES.AUTH_UNAVAILABLE,
      cause: error,
    });
  }
  return AppError.unauthorized(error.code === 'ERR_JWT_EXPIRED' ? 'Access token expired' : 'Invalid access token');
}

export function supabaseAdapter({ url, publishableKey, keys, emailsAreProven }) {
  const jwks = keys ?? remoteKeys(url, publishableKey);
  const checkEmails = emailsAreProven ?? createEmailTrust({ url, publishableKey });
  const rules = {
    algorithms: ['ES256', 'RS256'],
    issuer: `${url}/auth/v1`,
    audience: 'authenticated',
    requiredClaims: ['sub', 'exp'],
    clockTolerance: 5,
  };

  async function resolve(token) {
    let claims;
    try {
      ({ payload: claims } = await jwtVerify(token, jwks, rules));
    } catch (error) {
      throw refusal(error);
    }
    return { ...identityFromClaims(claims), emailProven: await checkEmails() };
  }

  return { resolve, emailsAreProven: checkEmails };
}
