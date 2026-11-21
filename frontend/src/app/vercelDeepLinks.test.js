// vercelDeepLinks.test.js
// A page opened straight from its address - a link from Google's consent
// screen to /privacy, say, or a refresh - must get the app, not a 404. On
// Vercel that is frontend/vercel.json's last rewrite, /(.*) to /index.html,
// reached by any path that is not a built file and not /api. Rewrite order
// and the API's own rule: vercelConfig.test.js.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const { rewrites } = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));

// The two patterns vercel.json uses - '/api/:path*' and '/(.*)' - as regular
// expressions: enough to ask which rewrite a path meets first.
const asRegExp = (source) => new RegExp(`^${source.replace('/:path*', '(?:/.*)?')}$`);
const firstRewrite = (path) => rewrites.find((rewrite) => asRegExp(rewrite.source).test(path));

describe('opening a page by its address on Vercel', () => {
  it('answers /privacy and the other app pages with the app', () => {
    for (const path of ['/privacy', '/login', '/register', '/app/123/schedule']) {
      expect(firstRewrite(path)?.destination, path).toBe('/index.html');
    }
  });

  it('still sends the API to the backend', () => {
    expect(firstRewrite('/api/v1/health').source).toBe('/api/:path*');
  });

  it('has no built file called privacy that would answer instead', () => {
    expect(existsSync(new URL('../../public/privacy', import.meta.url))).toBe(false);
    expect(existsSync(new URL('../../public/privacy.html', import.meta.url))).toBe(false);
  });
});
