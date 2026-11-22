// socialPreview.test.js
// A link to Relay shared in a chat app or on a social site shows a card made
// from index.html's Open Graph and Twitter tags. This checks those tags are
// all there, that the card's words match the page's own title and
// description, and that the picture they name is a real 1200x630 PNG in
// public/ - read from the size the file itself declares.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const LIVE_SITE = 'https://relay-fs.vercel.app';
const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const image = readFileSync(new URL('../../public/og-image.png', import.meta.url));

// The content of <meta property="og:x" content="..."> (or name="twitter:x").
function meta(key) {
  const tag = html.match(new RegExp(`<meta\\s+(?:property|name)="${key}"\\s+content="([^"]*)"`));
  return tag?.[1];
}

// Every PNG starts with an 8-byte signature and then its IHDR chunk, which
// holds the width and height as two 4-byte numbers at bytes 16 and 20.
const PNG_SIGNATURE = '89504e470d0a1a0a';

describe('the social preview card', () => {
  it('has every tag a card needs, with full addresses', () => {
    expect(meta('og:type')).toBe('website');
    expect(meta('og:url')).toBe(`${LIVE_SITE}/`);
    expect(meta('og:image')).toBe(`${LIVE_SITE}/og-image.png`);
    expect(meta('og:image:alt')).toMatch(/swap chain/);
    expect(meta('twitter:card')).toBe('summary_large_image');
  });

  it("uses the page's own title and description", () => {
    expect(meta('og:title')).toBe(html.match(/<title>([^<]*)<\/title>/)[1]);
    expect(meta('og:description')).toBe(meta('description'));
  });

  it('names a 1200x630 PNG that is really in public/', () => {
    expect(image.subarray(0, 8).toString('hex')).toBe(PNG_SIGNATURE);
    expect(image.subarray(12, 16).toString('ascii')).toBe('IHDR');
    expect([image.readUInt32BE(16), image.readUInt32BE(20)]).toEqual([1200, 630]);
    expect([meta('og:image:width'), meta('og:image:height')]).toEqual(['1200', '630']);
  });
});
