// 04-narrow-screens.spec.js
// Checklist section: "375px: no horizontal scroll on My Shifts and Fairness"
// - asserted as scrollWidth <= clientWidth on the whole document, once each
// page's data has arrived and been drawn.
//
// Both a worker and a manager, because the two see different Fairness pages.
//
// Also checked, because the screenshots caught it: nothing in the top bar
// sits on top of anything else. A long organisation name used to run under
// the theme toggle at this width - no sideways scroll, but still broken.

import { test, expect } from '../support/test.js';
import { appPath } from '../support/stack.js';
import { asha, manager } from '../support/people.js';
import { PHONE } from '../support/session.js';

const PAGES = [
  { name: 'my-shifts', heading: 'My shifts' },
  { name: 'fairness', heading: 'Fairness' },
];

/** How many pixels two boxes overlap side to side; 0 when they sit apart. */
const overlap = (a, b) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));

async function topBarOverlaps(page) {
  const switcher = await page.getByLabel('Switch organisation').boundingBox();
  const theme = await page.getByRole('radiogroup', { name: 'Theme' }).boundingBox();
  const user = await page.getByRole('button', { name: 'Open user menu' }).boundingBox();
  return { nameUnderThemeToggle: overlap(switcher, theme), themeToggleUnderUserMenu: overlap(theme, user) };
}

for (const person of [asha, manager]) {
  test(`${person.name}: no sideways scroll at 375px`, async ({ sessions }) => {
    const { page } = await sessions.open(person, { path: appPath('my-shifts'), viewport: PHONE });

    for (const { name, heading } of PAGES) {
      await page.goto(appPath(name));
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await page.waitForLoadState('networkidle');
      // The loading placeholders (components/ui/Skeleton.jsx) are gone: the real content is drawn.
      await expect(page.locator('.skeleton')).toHaveCount(0);

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `${name} is ${scrollWidth}px wide in a ${clientWidth}px screen`).toBeLessThanOrEqual(clientWidth);
      expect(await topBarOverlaps(page), `${name}: top-bar controls overlapping, in pixels`).toEqual({
        nameUnderThemeToggle: 0,
        themeToggleUnderUserMenu: 0,
      });
    }
  });
}
