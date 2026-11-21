// 03-axe.spec.js
// Milestone 9: automated accessibility checks. axe runs on the main pages -
// signed out, as a worker, as a manager and as the owner - in the light
// theme and the dark, and the suite fails on any serious or critical
// problem: missing names, contrast below WCAG AA, broken landmarks and the
// like. Everything axe reports, minor issues included, is kept in
// e2e/artifacts/numbers/axe.json.
//
// A page that shows each role something different is checked as the role
// that can do the most on it. Schedule: as the owner, on the draft, where
// every cell is a button (a manager sees the same grid; a worker sees text).
// Fairness: as the owner, whose view is everyone's table (a manager's is
// the same; a worker sees only their own share). Team: as a manager and as
// the owner, since only an owner may deactivate a manager. Swap approvals
// and Settings are the same for a manager and the owner.
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
import { asha, manager, owner } from '../support/people.js';
import { axeProblems } from '../support/axe.js';

const THEMES = ['light', 'dark'];
const PUBLIC_PAGES = ['/', '/privacy', '/login', '/register', '/forgot-password', '/reset-password', '/auth/callback'];
const WORKER_PAGES = ['schedule', 'my-shifts', 'availability', 'swaps', 'fairness', 'notifications', 'preferences'];
const MANAGER_PAGES = ['swaps/approvals', 'team', 'settings'];
const OWNER_PAGES = ['schedule', 'fairness', 'team'];

// An editable cell, named by exactly what it shows: "Day 07:00-15:00, change".
const EDITABLE_CELL = /^\w+ \d\d:\d\d-\d\d:\d\d, change$/;

async function checkEach(page, paths, who, theme) {
  const problems = [];
  for (const path of paths) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first(), `${path} has rendered`).toBeVisible();
    await page.waitForLoadState('networkidle');
    problems.push(...(await axeProblems(page, `${who}, ${theme}: ${path}`)).map((line) => `${path}: ${line}`));
  }
  expect(problems, `serious or critical accessibility problems (${who}, ${theme})`).toEqual([]);
}

for (const theme of THEMES) {
  test(`signed out, ${theme} theme: no serious accessibility problems`, async ({ sessions }) => {
    const { page } = await sessions.anonymous({ path: '/', colorScheme: theme, bypassCSP: true });
    await checkEach(page, PUBLIC_PAGES, 'signed out', theme);
  });

  test(`a worker, ${theme} theme: no serious accessibility problems`, async ({ sessions }) => {
    const { page } = await sessions.open(asha, { path: appPath('schedule'), colorScheme: theme, bypassCSP: true });
    await checkEach(page, WORKER_PAGES.map((p) => appPath(p)), 'a worker', theme);
  });

  test(`a manager, ${theme} theme: no serious accessibility problems`, async ({ sessions }) => {
    const { page } = await sessions.open(manager, { path: appPath('schedule'), colorScheme: theme, bypassCSP: true });
    await checkEach(page, MANAGER_PAGES.map((p) => appPath(p)), 'a manager', theme);
  });

  test(`the owner, ${theme} theme: no serious accessibility problems`, async ({ sessions }) => {
    const { page } = await sessions.open(owner, { path: appPath('schedule'), colorScheme: theme, bypassCSP: true });
    // Proof the grid axe is about to read is the editable one.
    await expect(page.getByRole('button', { name: EDITABLE_CELL }).first(), 'the draft opens with editable cells').toBeVisible();
    await checkEach(page, OWNER_PAGES.map((p) => appPath(p)), 'the owner', theme);
  });
}
