// supabaseAdapter.test.js
// The Supabase adapter's checks, offline: key pairs made here stand in for
// the project's signing keys (passed in as `keys`), and tokens are signed
// with them exactly as Supabase signs access tokens.
//
//   accepted  ES256 or RS256, the project's issuer, audience "authenticated"
//   401       expired, another issuer or audience, alg "none", HS256 (even
//             "signed" with the public key), an unknown key, an anonymous
//             or email-less sign-in, the anon role
//   503       the keys cannot be fetched - the session is not over

import { describe, it, expect, beforeAll } from 'vitest';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT, UnsecuredJWT, errors } from 'jose';
import { supabaseAdapter } from '../../src/services/identity/supabaseAdapter.js';

const PROJECT = 'https://abcdefghijklmnopqrst.supabase.co';
const ISSUER = `${PROJECT}/auth/v1`;
const CLAIMS = { email: 'Ada@Example.com', role: 'authenticated', is_anonymous: false, user_metadata: { name: 'Ada' } };

let ec;
let rsa;
let ecPublicJwk;
let adapter;

beforeAll(async () => {
  ec = await generateKeyPair('ES256');
  rsa = await generateKeyPair('RS256');
  ecPublicJwk = { ...(await exportJWK(ec.publicKey)), kid: 'ec', alg: 'ES256' };
  const keys = createLocalJWKSet({ keys: [ecPublicJwk, { ...(await exportJWK(rsa.publicKey)), kid: 'rsa', alg: 'RS256' }] });
  adapter = supabaseAdapter({ url: PROJECT, publishableKey: 'pk', keys, emailsAreProven: async () => true });
});

function sign({ key = ec.privateKey, alg = 'ES256', kid = 'ec', body = CLAIMS, issuer = ISSUER, audience = 'authenticated', expires = '1h' } = {}) {
  return new SignJWT(body)
    .setProtectedHeader({ alg, kid })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject('user-1')
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(key);
}

const refusalOf = (promise) =>
  promise.then(
    () => 'accepted',
    (error) => ({ status: error.statusCode, code: error.code, message: error.message }),
  );

describe('the Supabase adapter', () => {
  it('accepts an ES256 or RS256 token from the project, as the person it names', async () => {
    const identity = { externalId: 'user-1', email: 'ada@example.com', name: 'Ada', emailProven: true };
    expect(await adapter.resolve(await sign())).toEqual(identity);
    expect(await adapter.resolve(await sign({ key: rsa.privateKey, alg: 'RS256', kid: 'rsa' }))).toEqual(identity);
  });

  it('names someone by their email when their profile has no name', async () => {
    const token = await sign({ body: { ...CLAIMS, user_metadata: {} } });
    expect((await adapter.resolve(token)).name).toBe('ada');
  });

  it('refuses an expired token, a token from elsewhere, or for anyone but a signed-in user', async () => {
    const expired = await sign({ expires: Math.floor(Date.now() / 1000) - 60 });
    expect(await refusalOf(adapter.resolve(expired))).toMatchObject({ status: 401, message: 'Access token expired' });

    for (const token of [
      await sign({ issuer: 'https://otherprojectaaaaaaaaaa.supabase.co/auth/v1' }),
      await sign({ audience: 'anon' }),
      await sign({ body: { ...CLAIMS, role: 'anon' } }),
      await sign({ body: { ...CLAIMS, is_anonymous: true } }),
      await sign({ body: { ...CLAIMS, email: undefined } }),
    ]) {
      expect(await refusalOf(adapter.resolve(token))).toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    }
  });

  it('refuses alg "none", HS256 forged with the public key, and keys it does not know', async () => {
    const unsigned = new UnsecuredJWT(CLAIMS).setIssuer(ISSUER).setAudience('authenticated').setSubject('user-1').setExpirationTime('1h').encode();
    const forged = await sign({ alg: 'HS256', key: new TextEncoder().encode(JSON.stringify(ecPublicJwk)) });
    const stranger = await generateKeyPair('ES256');

    for (const token of [unsigned, forged, await sign({ key: stranger.privateKey }), await sign({ key: stranger.privateKey, kid: 'nope' }), 'not-a-token']) {
      expect(await refusalOf(adapter.resolve(token))).toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    }
  });

  it('answers 503 when the keys cannot be fetched, so nobody is signed out by an outage', async () => {
    for (const failure of [new TypeError('fetch failed'), new errors.JWKSTimeout(), new errors.JOSEError('Expected 200 OK')]) {
      const down = supabaseAdapter({ url: PROJECT, publishableKey: 'pk', keys: async () => Promise.reject(failure), emailsAreProven: async () => true });
      expect(await refusalOf(down.resolve(await sign()))).toMatchObject({ status: 503, code: 'AUTH_UNAVAILABLE' });
    }
  });

  it('passes on whether the project proves emails', async () => {
    const keys = createLocalJWKSet({ keys: [ecPublicJwk] });
    const unproven = supabaseAdapter({ url: PROJECT, publishableKey: 'pk', keys, emailsAreProven: async () => false });
    expect((await unproven.resolve(await sign())).emailProven).toBe(false);
  });
});
