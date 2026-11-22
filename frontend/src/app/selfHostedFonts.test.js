// selfHostedFonts.test.js
// Relay serves its own fonts (src/assets/fonts) instead of asking Google
// Fonts. The pieces that must agree: index.html names no font service and
// preloads the two Latin files every first screen uses; every @font-face in
// fonts.css points at a woff2 file that is really there and swaps in when it
// arrives; each family keeps its licence beside it; and each family in
// index.css is followed by a stand-in from fallbacks.css that carries the
// size and metric overrides.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const FONTS = new URL('../assets/fonts/', import.meta.url);
const read = (url) => readFileSync(url, 'utf8');
const html = read(new URL('../../index.html', import.meta.url));
const fontsCss = read(new URL('fonts.css', FONTS));
const fallbacksCss = read(new URL('fallbacks.css', FONTS));
const designCss = read(new URL('../index.css', import.meta.url));

const faces = (css) => [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map((match) => match[1]);
const descriptor = (face, name) => face.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();
const PRELOAD = /<link rel="preload" href="\/src\/assets\/fonts\/([^"]+)" as="font" type="font\/woff2" crossorigin \/>/g;

describe('self-hosted fonts', () => {
  it('asks no font service for anything', () => {
    expect(html).not.toMatch(/googleapis|gstatic/);
    expect(html).not.toMatch(/<link[^>]+rel="stylesheet"[^>]+https?:/);
  });

  it('serves every face from a woff2 file in this repo, swapping it in when it arrives', () => {
    expect(faces(fontsCss)).toHaveLength(6);
    for (const face of faces(fontsCss)) {
      const file = face.match(/url\('\.\/([^']+\.woff2)'\) format\('woff2'\)/)[1];
      expect(existsSync(new URL(file, FONTS)), file).toBe(true);
      expect(descriptor(face, 'font-display'), file).toBe('swap');
      expect(descriptor(face, 'font-style') ?? 'normal', file).toBe('normal');
    }
  });

  it('keeps the licence beside each family', () => {
    for (const family of ['archivo', 'inter', 'geist-mono']) {
      expect(read(new URL(`${family}/OFL.txt`, FONTS)), family).toContain('SIL Open Font License, Version 1.1');
    }
  });

  it('preloads the Latin Inter and Archivo files that fonts.css uses', () => {
    const preloads = [...html.matchAll(PRELOAD)].map((match) => match[1]);
    expect(preloads).toEqual(['inter/inter-latin-wght-normal.woff2', 'archivo/archivo-latin-wdth-normal.woff2']);
    for (const file of preloads) expect(fontsCss).toContain(`url('./${file}')`);
  });

  it('follows each family with a local stand-in sized to match it', () => {
    for (const family of ['Archivo', 'Inter', 'Geist Mono']) {
      expect(designCss).toContain(`'${family}', '${family} Fallback'`);
      const standIns = faces(fallbacksCss).filter((face) => descriptor(face, 'font-family') === `'${family} Fallback'`);
      expect(standIns.length, family).toBeGreaterThan(0);
      for (const face of standIns) {
        expect(descriptor(face, 'src'), family).toMatch(/^local\('/);
        for (const name of ['size-adjust', 'ascent-override', 'descent-override', 'line-gap-override']) {
          expect(descriptor(face, name), `${family}: ${name}`).toMatch(/^\d+(\.\d+)?%$/);
        }
      }
    }
  });
});
