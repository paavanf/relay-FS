// vercelConfig.test.js
// Checks frontend/vercel.json - how Vercel serves the built app - against
// what the app needs to work and stay safe:
//
//   /api       goes to the backend before anything falls back to the app,
//              so API calls are never answered with index.html
//   CSP        allows the inline theme script in index.html by the hash of
//              its current text, and no other inline script - so editing
//              that script without updating the hash fails here, not as a
//              blank page in production
//   the rest   no framing, and assets cached for a year while the app shell
//              is always checked again. Connections: vercelConnect.test.js
//
// The RELAY_API_HOST placeholder may or may not have been replaced yet; the
// checks hold either way. How to update the hash is in docs/deploy/DEPLOY.md.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = (name) => readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8');
const vercel = JSON.parse(read('vercel.json'));

// Browsers turn CRLF into LF before hashing a script, so this does too.
const html = read('index.html').replace(/\r\n?/g, '\n');
const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);

function headersFor(source) {
  const rule = vercel.headers.find((candidate) => candidate.source === source);
  return Object.fromEntries(rule.headers.map((header) => [header.key, header.value]));
}

// 'a b; c d' -> { a: ['b'], c: ['d'] }
function directives(policy) {
  const parts = policy.split(';').map((part) => part.trim()).filter(Boolean);
  return Object.fromEntries(parts.map((part) => [part.split(/\s+/)[0], part.split(/\s+/).slice(1)]));
}

const pageHeaders = headersFor('/(.*)');
const csp = directives(pageHeaders['Content-Security-Policy']);

describe('vercel.json', () => {
  it('sends /api to the backend first, and falls back to the app last', () => {
    const sources = vercel.rewrites.map((rewrite) => rewrite.source);
    const api = vercel.rewrites[sources.indexOf('/api/:path*')];
    expect(api.destination).toMatch(/^https:\/\/[^/]+\/api\/:path\*$/);
    expect(sources.indexOf('/api/:path*')).toBeLessThan(sources.indexOf('/(.*)'));
    expect(vercel.rewrites.at(-1)).toEqual({ source: '/(.*)', destination: '/index.html' });
  });

  it("allows index.html's inline theme script by its current hash, and no other inline script", () => {
    expect(inlineScripts).toHaveLength(1);
    const hash = createHash('sha256').update(inlineScripts[0], 'utf8').digest('base64');
    expect(csp['script-src']).toEqual(["'self'", `'sha256-${hash}'`]);
    expect(pageHeaders['Content-Security-Policy']).not.toContain('unsafe-inline');
    expect(pageHeaders['Content-Security-Policy']).not.toContain('unsafe-eval');
  });

  it('lets in only our own code and Google Fonts, and cannot be framed', () => {
    expect(csp['default-src']).toEqual(["'self'"]);
    expect(csp['style-src']).toEqual(["'self'", 'https://fonts.googleapis.com']);
    expect(csp['font-src']).toEqual(["'self'", 'https://fonts.gstatic.com']);
    expect(csp['frame-ancestors']).toEqual(["'none'"]);
    expect(csp['object-src']).toEqual(["'none'"]);
    expect(pageHeaders).toMatchObject({
      'Strict-Transport-Security': expect.stringMatching(/^max-age=\d{8,}/),
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': expect.stringContaining('camera=()'),
    });
  });

  it('caches hashed assets for a year, and never serves a stale app shell', () => {
    expect(headersFor('/assets/(.*)')['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(headersFor('/((?!assets/).*)')['Cache-Control']).toBe('no-cache');
  });
});
