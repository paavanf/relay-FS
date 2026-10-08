// 06-screenshots.spec.js
// Checklist section: "Screenshots for me" - each subject in light and dark,
// at 1440px and 375px, for a person to review. Nothing here judges looks; a
// test fails only if what it should show is not on the page.
//
// Files land in e2e/artifacts/screenshots/<subject>-<theme>-<width>.png;
// support/screens.js does the capturing.

import { test, expect } from '../support/test.js';
import { stack, appPath } from '../support/stack.js';
import { manager, asha, grace, erin } from '../support/people.js';
import { showRoster, tryShift, firstWeekday, THURSDAY } from '../support/schedule.js';
import { captureAll } from '../support/screens.js';

test('schedule grid with its coverage bar', async ({ sessions }) => {
  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await showRoster(page, stack().holes);
  await expect(page.getByRole('rowheader', { name: 'Coverage' })).toBeVisible();
  await captureAll(page, 'schedule-grid');
});

test('unfilled panel with its reasons', async ({ sessions }) => {
  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await showRoster(page, stack().holes);
  // The card itself: the innermost box holding both its heading and its list.
  const panel = page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: 'Unfilled shifts' }) })
    .filter({ has: page.getByRole('list') })
    .last();
  await expect(panel.getByRole('listitem').first()).toBeVisible();
  await captureAll(page, 'unfilled-panel', { target: panel });
});

test('assign dialog showing a blocked assignment', async ({ sessions }) => {
  const { draft } = stack();
  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await showRoster(page, draft);
  // Grace never works Thursdays, so any Thursday is a refusal.
  const dialog = await tryShift(page, draft, grace.name, firstWeekday(draft, THURSDAY), 'Day');
  await expect(dialog.getByText(/^Declared unavailable on/)).toBeVisible();
  await captureAll(page, 'assign-dialog-blocked', { dialog: true });
});

test('publish dialog, with holes to acknowledge', async ({ sessions }) => {
  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await showRoster(page, stack().holes);
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByRole('dialog').getByText(/still unfilled/)).toBeVisible();
  await captureAll(page, 'publish-dialog', { dialog: true });
});

test('my shifts', async ({ sessions }) => {
  const { page } = await sessions.open(asha, { path: appPath('my-shifts') });
  await expect(page.getByRole('heading', { level: 1, name: 'My shifts' })).toBeVisible();
  await expect(page.locator('.skeleton')).toHaveCount(0);
  await captureAll(page, 'my-shifts');
});

test('fairness, as a manager', async ({ sessions }) => {
  const { page } = await sessions.open(manager, { path: appPath('fairness') });
  await expect(page.getByText(/^Team average:/)).toBeVisible();
  await captureAll(page, 'fairness-manager');
});

test('fairness, as a worker', async ({ sessions }) => {
  const { page } = await sessions.open(asha, { path: appPath('fairness') });
  await expect(page.getByRole('heading', { name: 'Your shifts in this period' })).toBeVisible();
  await captureAll(page, 'fairness-worker');
});

test('fairness empty state', async ({ sessions }) => {
  const { page } = await sessions.open(erin, { path: appPath('fairness', stack().emptyOrgId) });
  await expect(page.getByRole('heading', { name: 'Nothing to measure yet' })).toBeVisible();
  await captureAll(page, 'fairness-empty');
});
