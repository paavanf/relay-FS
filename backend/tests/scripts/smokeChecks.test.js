// smokeChecks.test.js
// The deployed-site smoke test's page checks (scripts/smoke/pageChecks.mjs),
// run against stand-in answers - never a real site, since nothing here may
// make a request:
//   - the page's connect-src must be exactly itself and the Supabase project:
//     a wildcard, another project or a bare https: fails the check
//   - every page a link can open cold - /privacy first - must get the app

import { describe, it, expect, vi, afterEach } from 'vitest';
import { securityHeaders, appRoutes, COLD_PATHS } from '../../../scripts/smoke/pageChecks.mjs';

const SITE = 'https://relay.example';
const SUPABASE = 'https://abcdefghijklmnopqrst.supabase.co';
const policy = (connect) => `default-src 'self'; script-src 'self' 'sha256-abc'; connect-src ${connect}; frame-ancestors 'none'`;

function pageWith(csp) {
  const landingHeaders = new Headers({
    'content-security-policy': csp,
    'strict-transport-security': 'max-age=63072000; includeSubDomains',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'permissions-policy': 'camera=()',
  });
  return { origin: SITE, supabase: { origin: SUPABASE }, landingHeaders };
}

// A stand-in site: the app's page for every path, except the ones given.
function siteAnswering(missing = []) {
  const asked = [];
  vi.stubGlobal('fetch', async (url) => {
    const path = new URL(url).pathname;
    asked.push(path);
    if (missing.includes(path)) return new Response('Not found', { status: 404 });
    return new Response('<div id="root"></div>', { status: 200, headers: { 'content-type': 'text/html' } });
  });
  return asked;
}

afterEach(() => vi.unstubAllGlobals());

describe("the smoke test's page checks", () => {
  it("pass a connect-src of exactly 'self' and the Supabase project", async () => {
    const result = await securityHeaders(pageWith(policy(`'self' ${SUPABASE}`)));
    expect(result).toMatchObject({ ok: true });
  });

  it('fail a connect-src that allows anything broader, or another project', async () => {
    const broader = [`'self' ${SUPABASE} https://*.supabase.co`, `'self' ${SUPABASE} https:`, `'self' *`, `'self' https://zyxwvutsrqponmlkjihg.supabase.co`, `'self'`];
    for (const connect of broader) {
      const result = await securityHeaders(pageWith(policy(connect)));
      expect(result.ok, connect).toBe(false);
      expect(result.detail).toContain(`connect-src 'self' ${SUPABASE} and nothing else`);
    }
  });

  it('ask for /privacy and every page a link can open, and pass when the app answers each', async () => {
    const asked = siteAnswering();
    expect(await appRoutes({ origin: SITE })).toMatchObject({ ok: true });
    expect(asked).toEqual(COLD_PATHS);
    expect(COLD_PATHS[0]).toBe('/privacy');
  });

  it('fail, naming the page, when /privacy is not served by the app', async () => {
    siteAnswering(['/privacy']);
    expect(await appRoutes({ origin: SITE })).toEqual({ ok: false, detail: '/privacy answered 404' });
  });
});
