// design-review.spec.js
// Screenshots for judging a visual change: every page - signed out, as a
// worker and as a manager - plus an empty state and a dialog, each in light
// and dark at 1440px and 375px, saved under e2e/artifacts/<DESIGN_SET>/ so a
// "before" and an "after" set sit side by side. Not part of the normal run:
// playwright.config.js only collects this file when DESIGN_SET is set.
//
//   DESIGN_SET=before npm run e2e -- design-review
//   DESIGN_SET=after npm run e2e -- design-review -g schedule
//
// Motion is reduced, so an animated page is captured in its settled state.
// Read-only: pages are opened and captured, nothing is changed.

import { test, expect } from '../support/test.js';
import { stack, appPath } from '../support/stack.js';
import { manager, asha, grace, erin } from '../support/people.js';
import { showRoster, tryShift, firstWeekday, THURSDAY } from '../support/schedule.js';
import { findSwapCases, findSwapsForMyOffer, firstOption } from '../support/swaps.js';
import { captureAll } from '../support/screens.js';

const folder = process.env.DESIGN_SET;
const capture = async (page, subject, options = {}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await captureAll(page, subject, { folder, ...options });
};

// Opened and captured as they are: [subject, who, path].
const PAGES = [
  ['landing', null, () => '/'],
  ['privacy', null, () => '/privacy'],
  ['login', null, () => '/login'],
  ['register', null, () => '/register'],
  ['forgot-password', null, () => '/forgot-password'],
  ['my-shifts', asha, () => appPath('my-shifts')],
  ['availability', asha, () => appPath('availability')],
  ['notifications', asha, () => appPath('notifications')],
  ['preferences', asha, () => appPath('preferences')],
  ['fairness', manager, () => appPath('fairness')],
  ['swap-approvals', manager, () => appPath('swaps/approvals')],
  ['team', manager, () => appPath('team')],
  ['settings', manager, () => appPath('settings')],
  ['fairness-empty', erin, () => appPath('fairness', stack().emptyOrgId)],
];

for (const [subject, who, path] of PAGES) {
  test(subject, async ({ sessions }) => {
    const { page } = who ? await sessions.open(who, { path: path() }) : await sessions.anonymous();
    if (!who) await page.goto(path());
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.skeleton')).toHaveCount(0);
    await capture(page, subject);
  });
}

test('schedule, with a generated roster', async ({ sessions }) => {
  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await showRoster(page, stack().holes);
  await expect(page.getByRole('rowheader', { name: 'Coverage' })).toBeVisible();
  await capture(page, 'schedule');
});

test('swaps, with a chain showing', async ({ sessions }) => {
  const { chain } = await findSwapCases();
  const { page } = await sessions.open(chain.person, { path: appPath('swaps') });
  await findSwapsForMyOffer(page, chain.request);
  await expect(firstOption(page, 'Swap chains')).toBeVisible();
  await capture(page, 'swaps-chain');
});

test('a dialog: assigning a shift the rules refuse', async ({ sessions }) => {
  const { draft } = stack();
  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await showRoster(page, draft);
  const dialog = await tryShift(page, draft, grace.name, firstWeekday(draft, THURSDAY), 'Day');
  await expect(dialog.getByText(/^Declared unavailable on/)).toBeVisible();
  await capture(page, 'assign-dialog', { dialog: true });
});
