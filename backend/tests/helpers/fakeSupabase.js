// fakeSupabase.js
// A stand-in for a Supabase project's two public endpoints, on a local port,
// for the tests that run the app the way production does (AUTH_MODE=supabase):
//
//   GET /auth/v1/.well-known/jwks.json   the public half of a key made here
//   GET /auth/v1/settings                { mailer_autoconfirm }
//
// signToken() signs an access token with the private half, just as Supabase
// would, so the real adapter - its fetch, cache and checks - verifies it.
// Nothing leaves the machine: the server listens on 127.0.0.1 only.

import http from 'node:http';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';

export async function startFakeSupabase({ autoconfirm = false } = {}) {
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'fake-key', alg: 'ES256', use: 'sig' };
  const state = { autoconfirm, requests: [], down: false };

  const server = http.createServer((req, res) => {
    state.requests.push(req.url);
    const body = {
      '/auth/v1/.well-known/jwks.json': { keys: [jwk] },
      '/auth/v1/settings': { mailer_autoconfirm: state.autoconfirm },
    }[req.url];
    res.writeHead(state.down ? 503 : body ? 200 : 404, { 'content-type': 'application/json' });
    res.end(JSON.stringify(state.down ? {} : (body ?? {})));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;

  async function signToken({ email, sub = `fake-${email}`, name, expiresIn = 3600, issuer = `${url}/auth/v1`, signedInAt = Date.now() }) {
    const now = Math.floor(Date.now() / 1000);
    const amr = [{ method: 'password', timestamp: Math.floor(signedInAt / 1000) }];
    return new SignJWT({ email, role: 'authenticated', is_anonymous: false, user_metadata: name ? { name } : {}, amr })
      .setProtectedHeader({ alg: 'ES256', kid: 'fake-key' })
      .setIssuer(issuer)
      .setAudience('authenticated')
      .setSubject(sub)
      .setIssuedAt(now)
      .setExpirationTime(now + expiresIn)
      .sign(privateKey);
  }

  const close = () => new Promise((resolve) => server.close(resolve));
  return { url, state, signToken, close };
}
