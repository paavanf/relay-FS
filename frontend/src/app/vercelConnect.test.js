// vercelConnect.test.js
// Where the page may connect to, by the Content-Security-Policy in
// frontend/vercel.json: its own origin - the API, through Vercel's /api
// rewrite - and at most one Supabase project, the production one people
// sign in with. Nothing else.
//
// The project is named by its ref, which is always 20 lowercase letters
// (https://<ref>.supabase.co). A mistyped or half-copied ref would block
// every sign-in in production; here it fails a test instead.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const vercel = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
const policy = vercel.headers.find((rule) => rule.source === '/(.*)').headers.find((header) => header.key === 'Content-Security-Policy').value;
const connectSrc = policy
  .split(';')
  .map((part) => part.trim().split(/\s+/))
  .find(([name]) => name === 'connect-src')
  .slice(1);

describe('where the page may connect', () => {
  it('connects to its own origin first', () => {
    expect(connectSrc[0]).toBe("'self'");
  });

  it('connects to at most one Supabase project, named by a real project ref', () => {
    const others = connectSrc.slice(1);
    expect(others.length).toBeLessThanOrEqual(1);
    for (const origin of others) expect(origin).toMatch(/^https:\/\/[a-z]{20}\.supabase\.co$/);
  });
});
