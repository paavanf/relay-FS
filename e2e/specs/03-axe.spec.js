// 03-axe.spec.js
// Milestone 9: automated accessibility checks. axe runs on every signed-out
// page and on the main pages as a worker, a manager and the owner, in the
// light theme and the dark, against WCAG 2.1 A and AA and axe's
// best-practice rules (support/axe.js). The suite fails on anything axe
// reports, minor issues included: missing names, contrast below AA, a page
// with no main landmark, content outside the landmarks and the like. All of
// it is also kept in e2e/artifacts/numbers/axe.json.
//
// A page that shows each role something different is checked as the role
// that can do the most on it. Schedule: as the owner, on the draft, where
// every cell is a button (a manager sees the same grid; a worker sees text).
// Fairness: as the owner, whose view is everyone's table (a manager's is
// the same; a worker sees only their own share). Team: as a manager and as
// the owner, since only an owner may deactivate a manager. Swap approvals
// and Settings are the same for a manager and the owner.
//
// Read-only: pages are opened and read, nothing is changed. The invite page
// is opened with a token that matches no invite, so it says the link is no
// longer valid; /403 and an unknown address show their own pages.
//
// Like every other spec, these pages run under the production
// Content-Security-Policy. axe fetches each stylesheet itself to read its
// rules, and Relay serves all of its own - its fonts included.

import { test, expect } from '../support/test.js';
import { appPath } from '../support/stack.js';
import { asha, manager, owner } from '../support/people.js';
import { axeProblems } from '../support/axe.js';

const THEMES = ['light', 'dark'];
const PUBLIC_PAGES = [
  '/', '/privacy', '/login', '/register', '/forgot-password', '/reset-password', '/auth/callback',
  '/invite/no-such-invite', '/403', '/no-such-page',
];
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
  expect(problems, `accessibility problems (${who}, ${theme})`).toEqual([]);
}

for (const theme of THEMES) {
  test(`signed out, ${theme} theme: no accessibility problems`, async ({ sessions }) => {
    const { page } = await sessions.anonymous({ path: '/', colorScheme: theme });
    await checkEach(page, PUBLIC_PAGES, 'signed out', theme);
  });

  test(`a worker, ${theme} theme: no accessibility problems`, async ({ sessions }) => {
    const { page } = await sessions.open(asha, { path: appPath('schedule'), colorScheme: theme });
    await checkEach(page, WORKER_PAGES.map((p) => appPath(p)), 'a worker', theme);
  });

  test(`a manager, ${theme} theme: no accessibility problems`, async ({ sessions }) => {
    const { page } = await sessions.open(manager, { path: appPath('schedule'), colorScheme: theme });
    await checkEach(page, MANAGER_PAGES.map((p) => appPath(p)), 'a manager', theme);
  });

  test(`the owner, ${theme} theme: no accessibility problems`, async ({ sessions }) => {
    const { page } = await sessions.open(owner, { path: appPath('schedule'), colorScheme: theme });
    // Proof the grid axe is about to read is the editable one.
    await expect(page.getByRole('button', { name: EDITABLE_CELL }).first(), 'the draft opens with editable cells').toBeVisible();
    await checkEach(page, OWNER_PAGES.map((p) => appPath(p)), 'the owner', theme);
  });
}
