// pageChecks.mjs - what a visitor's browser gets before anyone signs in: the
// page itself and its security headers, the pages a link can open cold
// served by the app, and the API reached through Vercel's /api rewrite. Each
// check returns { ok, detail } - or { warn } for something to act on that is
// not broken.
import { timed } from './http.mjs';

/** One directive's sources from a Content-Security-Policy: 'a b; c d', 'c' -> ['d']. */
function sources(csp, name) {
  const parts = csp.split(';').map((part) => part.trim().split(/\s+/));
  return parts.find(([directive]) => directive === name)?.slice(1) ?? [];
}

export async function landingPage(ctx) {
  const { res, ms, text } = await timed(`${ctx.origin}/`);
  ctx.landingHeaders = res.headers;
  const isApp = res.status === 200 && text.includes('<div id="root">');
  return { ok: isApp, detail: isApp ? `${ms} ms` : `${res.status}, not the app's page` };
}

export async function healthThroughApi(ctx) {
  // The API sleeps when idle and takes up to a minute to wake: wait for it.
  const { res, ms, json } = await timed(`${ctx.origin}/api/v1/health`, { timeoutMs: 120_000 });
  const ok = res.status === 200 && json?.status === 'ok' && json?.database === 'connected';
  const woke = ms > 10_000 ? ' - the API was asleep, and woke' : '';
  if (ok && json.clientIp) {
    return {
      ok,
      warn: `EXPOSE_CLIENT_IP is on: the API sees you as ${json.clientIp} (X-Forwarded-For held ${json.forwardedHops}). Check that is your address, then set it back to false.`,
    };
  }
  return { ok, detail: ok ? `${ms} ms${woke}` : `${res.status} ${JSON.stringify(json)}` };
}

export async function publicConfig(ctx) {
  const { res, json } = await timed(`${ctx.origin}/api/v1/config`);
  const ok = res.status === 200 && typeof json?.emailEnabled === 'boolean';
  return { ok, detail: ok ? `emailEnabled: ${json.emailEnabled}` : `${res.status} ${JSON.stringify(json)}` };
}

export async function securityHeaders(ctx) {
  const headers = ctx.landingHeaders;
  const csp = headers.get('content-security-policy') ?? '';
  const scriptSrc = csp.split(';').find((part) => part.trim().startsWith('script-src')) ?? '';
  const hsts = Number(headers.get('strict-transport-security')?.match(/max-age=(\d+)/)?.[1] ?? 0);
  // The page may talk to itself and to this Supabase project - nothing broader,
  // so no wildcard, no other project and no bare https: either.
  const connect = sources(csp, 'connect-src');
  const connectExact = connect.length === 2 && connect.includes("'self'") && connect.includes(ctx.supabase.origin);
  const problems = [
    !csp.includes("frame-ancestors 'none'") && "CSP frame-ancestors 'none'",
    !connectExact && `CSP connect-src 'self' ${ctx.supabase.origin} and nothing else (it has: ${connect.join(' ') || 'none'})`,
    (!scriptSrc || scriptSrc.includes('unsafe-inline')) && "CSP script-src without 'unsafe-inline'",
    hsts < 31_536_000 && 'Strict-Transport-Security of a year or more',
    headers.get('x-content-type-options') !== 'nosniff' && 'X-Content-Type-Options: nosniff',
    headers.get('referrer-policy') !== 'no-referrer' && 'Referrer-Policy: no-referrer',
    !headers.get('permissions-policy') && 'Permissions-Policy',
  ].filter(Boolean);
  const detail = problems.length ? `missing: ${problems.join(', ')}` : `CSP (connect-src 'self' and Supabase only), HSTS, nosniff, Referrer-Policy, Permissions-Policy`;
  return { ok: problems.length === 0, detail };
}

// A link opened cold - the privacy policy from Google's consent screen, a
// confirmation email, a password reset - is a request for that path, and so
// is a refresh: the app must answer each, not a 404.
export const COLD_PATHS = ['/privacy', '/login', '/auth/callback', '/reset-password'];

export async function appRoutes(ctx) {
  for (const path of COLD_PATHS) {
    const { res, text } = await timed(`${ctx.origin}${path}`);
    if (res.status !== 200 || !text.includes('<div id="root">')) return { ok: false, detail: `${path} answered ${res.status}` };
  }
  return { ok: true, detail: `${COLD_PATHS.join(', ')} are served by the app` };
}
