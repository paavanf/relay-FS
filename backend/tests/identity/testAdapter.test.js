// testAdapter.test.js
// The offline stand-in for Supabase: it can only be created under
// NODE_ENV=test, accepts only HS256 tokens signed with this run's secret,
// and reads email_verified: false as "this email is not proven".

import { describe, it, expect, beforeAll } from 'vitest';
import { generateKeyPair, SignJWT } from 'jose';
import { testAdapter, TEST_ISSUER } from '../../src/services/identity/testAdapter.js';
import { tokenFor } from '../helpers/identity.js';

let adapter;

beforeAll(() => {
  adapter = testAdapter({ nodeEnv: 'test', secret: process.env.AUTH_TEST_SECRET });
});

const refusalOf = (promise) =>
  promise.then(
    () => 'accepted',
    (error) => ({ status: error.statusCode, message: error.message }),
  );

describe('the test identity adapter', () => {
  it('refuses to exist outside NODE_ENV=test', () => {
    for (const nodeEnv of ['production', 'development', undefined]) {
      expect(() => testAdapter({ nodeEnv, secret: 'x'.repeat(40) })).toThrow('only runs when NODE_ENV=test');
    }
  });

  it('accepts a test token, with its email proven unless it says otherwise', async () => {
    const identity = await adapter.resolve(await tokenFor({ email: 'Wren@Example.com', name: 'Wren' }));
    expect(identity).toMatchObject({ email: 'wren@example.com', name: 'Wren', emailProven: true });

    const unproven = await adapter.resolve(await tokenFor({ email: 'wren@example.com', emailVerified: false }));
    expect(unproven.emailProven).toBe(false);
  });

  it('refuses an expired token, another secret, or an asymmetric token', async () => {
    expect(await refusalOf(adapter.resolve(await tokenFor({ email: 'a@example.com', expiresIn: -60 })))).toEqual({
      status: 401,
      message: 'Access token expired',
    });

    const otherSecret = testAdapter({ nodeEnv: 'test', secret: 'y'.repeat(64) });
    expect(await refusalOf(otherSecret.resolve(await tokenFor({ email: 'a@example.com' })))).toMatchObject({ status: 401 });

    const { privateKey } = await generateKeyPair('ES256');
    const asymmetric = await new SignJWT({ email: 'a@example.com', role: 'authenticated' })
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuer(TEST_ISSUER)
      .setAudience('authenticated')
      .setSubject('a')
      .setExpirationTime('1h')
      .sign(privateKey);
    expect(await refusalOf(adapter.resolve(asymmetric))).toMatchObject({ status: 401 });
  });
});
