// sessionChecks.mjs - signing in as the shared demo's owner, as the demo's
// "Sign in as the owner" button does, and what that session can and cannot
// reach. The sign-in is the smoke test's only write.
import { randomBytes } from 'node:crypto';
import { timed, cookieAttributes } from './http.mjs';
import { DEMO_PASSWORD, EMAIL_DOMAIN } from '../../backend/scripts/demo/ward.js';

const OWNER_EMAIL = `owner@${EMAIL_DOMAIN}`;
const COOKIE_NAME = 'relay_refresh';
const COOKIE_PATH = '/api/v1/auth';

export async function demoSignIn(ctx) {
  const { res, ms, json } = await timed(`${ctx.origin}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ctx.origin },
    body: JSON.stringify({ email: OWNER_EMAIL, password: DEMO_PASSWORD }),
  });
  ctx.token = json?.accessToken;
  ctx.orgId = json?.memberships?.[0]?.orgId;
  ctx.setCookies = res.headers.getSetCookie();
  const ok = res.status === 200 && Boolean(ctx.token);
  return { ok, detail: ok ? `${OWNER_EMAIL}, ${ms} ms` : `${res.status} ${json?.error?.message ?? ''} - has the nightly job seeded the demo?` };
}

export async function refreshCookie(ctx) {
  const raw = ctx.setCookies?.find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));
  if (!raw) return { ok: false, detail: `no ${COOKIE_NAME} cookie was set` };
  const cookie = cookieAttributes(raw);
  ctx.cookie = `${cookie.name}=${cookie.value}`;
  const problems = [
    !cookie.httponly && 'HttpOnly',
    !cookie.secure && 'Secure',
    String(cookie.samesite).toLowerCase() !== 'strict' && 'SameSite=Strict',
    cookie.domain && `host-only (it names Domain=${cookie.domain})`,
    cookie.path !== COOKIE_PATH && `Path=${COOKIE_PATH} (it is ${cookie.path ?? 'unset'})`,
  ].filter(Boolean);
  return { ok: problems.length === 0, detail: problems.length ? `missing: ${problems.join(', ')}` : `HttpOnly, Secure, SameSite=Strict, host-only, Path=${COOKIE_PATH}` };
}

export async function reloadKeepsSession(ctx) {
  // A reload: the page asks for a new access token with the cookie alone, then who it is.
  const refreshed = await timed(`${ctx.origin}/api/v1/auth/refresh`, { method: 'POST', headers: { Cookie: ctx.cookie ?? '', Origin: ctx.origin } });
  const token = refreshed.json?.accessToken;
  if (refreshed.res.status !== 200 || !token) return { ok: false, detail: `refresh answered ${refreshed.res.status}` };
  const me = await timed(`${ctx.origin}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  const ok = me.res.status === 200 && me.json?.user?.email === OWNER_EMAIL;
  return { ok, detail: ok ? 'refresh, then /auth/me, as the same person' : `/auth/me answered ${me.res.status}` };
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
