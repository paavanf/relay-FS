// screens.js
// Capturing one subject for review: in light and dark, at 1440px and 375px,
// as four files in e2e/artifacts/screenshots/<subject>-<theme>-<width>.png.
//
// Light and dark are switched through the browser's colour-scheme setting,
// which the app follows while nobody has picked a theme by hand. And because
// the app scrolls inside its main panel rather than the document,
// Playwright's fullPage capture would stop at the fold - so for a whole page
// the window is made as tall as its content, captured, and put back.

import { expect } from '@playwright/test';
import { DESKTOP, PHONE } from './session.js';
import { artifactPath } from './artifacts.js';

const TALLEST_PX = 4000;

async function contentHeight(page) {
  return page.evaluate(() => {
    let hidden = 0;
    for (const element of document.querySelectorAll('*')) {
      if (/(auto|scroll)/.test(getComputedStyle(element).overflowY)) {
        hidden = Math.max(hidden, element.scrollHeight - element.clientHeight);
      }
    }
    return Math.max(document.documentElement.scrollHeight, window.innerHeight + hidden);
  });
}

/** target: capture this element instead of the page. dialog: capture the window as it is. */
export async function captureAll(page, subject, { target, dialog = false } = {}) {
  for (const viewport of [DESKTOP, PHONE]) {
    for (const theme of ['light', 'dark']) {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme });
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const path = artifactPath('screenshots', `${subject}-${theme}-${viewport.width}.png`);

      if (target) await target.screenshot({ path });
      else if (dialog) await page.screenshot({ path });
      else {
        await page.setViewportSize({ ...viewport, height: Math.min(await contentHeight(page), TALLEST_PX) });
        await page.screenshot({ path });
      }
    }
  }
  await page.setViewportSize(DESKTOP);
}
