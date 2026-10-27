// sessionChecks.mjs - signing in as the shared demo's owner, as the demo's
// "Sign in as the owner" button does: with Supabase first, then to Relay's
// API with the token - and what that session can and cannot reach. Signing
// in, and out again at the end, are the smoke test's only writes.
import { randomBytes } from 'node:crypto';
import { timed } from './http.mjs';
import { DEMO_PASSWORD, EMAIL_DOMAIN } from '../../backend/scripts/demo/ward.js';

const OWNER_EMAIL = `owner@${EMAIL_DOMAIN}`;

/** A request to the Supabase project's Auth API, with its publishable key. */
function supabase(ctx, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json', apikey: ctx.supabase.key };
  if (token) headers.Authorization = `Bearer ${token}`;
  return timed(`${ctx.supabase.url}/auth/v1${path}`, { method: 'POST', headers, body: JSON.stringify(body ?? {}) });
}

const me = (ctx, token) => timed(`${ctx.origin}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` } });

export async function demoSignIn(ctx) {
  const { res, ms, json } = await supabase(ctx, '/token?grant_type=password', { body: { email: OWNER_EMAIL, password: DEMO_PASSWORD } });
  ctx.token = json?.access_token;
  ctx.refreshToken = json?.refresh_token;
  const ok = res.status === 200 && Boolean(ctx.token);
  const why = json?.msg ?? json?.error_description ?? '';
  return { ok, detail: ok ? `${OWNER_EMAIL}, ${ms} ms` : `${res.status} ${why} - has the nightly job made the demo accounts?` };
}

export async function relayKnowsThem(ctx) {
  const { res, json } = await me(ctx, ctx.token);
  ctx.orgId = json?.memberships?.[0]?.orgId;
  const ok = res.status === 200 && json?.user?.email === OWNER_EMAIL && json.user.isDemo === true && Boolean(ctx.orgId);
  return { ok, detail: ok ? 'the demo owner, in the demo ward' : `/auth/me answered ${res.status} ${json?.error?.code ?? ''}` };
}

export async function refreshKeepsSession(ctx) {
  // What the page does when an hour is up: a new access token from the refresh token.
  const refreshed = await supabase(ctx, '/token?grant_type=refresh_token', { body: { refresh_token: ctx.refreshToken } });
  ctx.token = refreshed.json?.access_token ?? ctx.token;
  if (refreshed.res.status !== 200 || !refreshed.json?.access_token) return { ok: false, detail: `refresh answered ${refreshed.res.status}` };
  const { res, json } = await me(ctx, ctx.token);
  const ok = res.status === 200 && json?.user?.email === OWNER_EMAIL;
  return { ok, detail: ok ? 'refreshed, then /auth/me, as the same person' : `/auth/me answered ${res.status}` };
}

export async function otherOrgHidden(ctx) {
  const members = (orgId) => timed(`${ctx.origin}/api/v1/orgs/${orgId}/members`, { headers: { Authorization: `Bearer ${ctx.token}` } });
  const own = await members(ctx.orgId);
  let otherId = randomBytes(12).toString('hex');
  if (otherId === ctx.orgId) otherId = randomBytes(12).toString('hex');
  const other = await members(otherId);
  const ok = own.res.status === 200 && other.res.status === 404;
  return { ok, detail: `own organisation ${own.res.status}, another one ${other.res.status} (404 expected)` };
}

export async function signsOut(ctx) {
  // This session only - the demo's other visitors stay signed in.
  const { res } = await supabase(ctx, '/logout?scope=local', { token: ctx.token });
  return { ok: res.status === 204, detail: res.status === 204 ? 'this session only' : `logout answered ${res.status}` };
}
