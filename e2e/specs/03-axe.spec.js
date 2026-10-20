// 03-axe.spec.js
// Milestone 9: automated accessibility checks. axe runs on the main pages -
// signed out, as a worker and as a manager - in the light theme and the
// dark, and the suite fails on any serious or critical problem: missing
// names, contrast below WCAG AA, broken landmarks and the like. Everything
// axe reports, minor issues included, is kept in
// e2e/artifacts/numbers/axe.json.
//
// Read-only: pages are opened and read, nothing is changed.
//
// axe fetches each stylesheet itself to read its rules - Google Fonts' too -
// and the production Content-Security-Policy (connect-src 'self') rightly
// refuses that connection. The app never makes it, so these pages are opened
// with the policy off (bypassCSP); every other spec, 03-every-page among
// them, opens the same pages under it.

import { test, expect } from '../support/test.js';
import { appPath } from '../support/stack.js';
import { asha, manager } from '../support/people.js';
import { axeProblems } from '../support/axe.js';

const THEMES = ['light', 'dark'];
const PUBLIC_PAGES = ['/', '/login', '/register', '/forgot-password'];
const WORKER_PAGES = ['schedule', 'my-shifts', 'availability', 'swaps', 'fairness', 'notifications', 'preferences'];
const MANAGER_PAGES = ['swaps/approvals', 'team', 'settings'];

async function checkEach(page, paths, theme) {
  const problems = [];
  for (const path of paths) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first(), `${path} has rendered`).toBeVisible();
    await page.waitForLoadState('networkidle');
    problems.push(...(await axeProblems(page, `${theme} ${path}`)).map((line) => `${path}: ${line}`));
  }
  expect(problems, `serious or critical accessibility problems (${theme})`).toEqual([]);
}

for (const theme of THEMES) {
  test(`signed out, ${theme} theme: no serious accessibility problems`, async ({ sessions }) => {
    const { page } = await sessions.anonymous({ path: '/', colorScheme: theme, bypassCSP: true });
    await checkEach(page, PUBLIC_PAGES, theme);
  });

  test(`a worker, ${theme} theme: no serious accessibility problems`, async ({ sessions }) => {
    const { page } = await sessions.open(asha, { path: appPath('schedule'), colorScheme: theme, bypassCSP: true });
    await checkEach(page, WORKER_PAGES.map((p) => appPath(p)), theme);
  });

  test(`a manager, ${theme} theme: no serious accessibility problems`, async ({ sessions }) => {
    const { page } = await sessions.open(manager, { path: appPath('schedule'), colorScheme: theme, bypassCSP: true });
    await checkEach(page, MANAGER_PAGES.map((p) => appPath(p)), theme);
  });
}
