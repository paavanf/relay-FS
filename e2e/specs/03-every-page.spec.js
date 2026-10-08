// 03-every-page.spec.js
// Checklist section: "Every page: no console errors, no 5xx responses".
//
// Every page a signed-out visitor, a worker and a manager can open, each
// loaded cold - a full page load, as from a bookmark - and given time to
// finish its requests. Stricter than the check every test gets: here even a
// 4xx the browser complains about counts as a failure.

import { test, expect } from '../support/test.js';
import { appPath } from '../support/stack.js';
import { asha, manager } from '../support/people.js';

const PUBLIC_PAGES = ['/', '/login', '/register', '/forgot-password'];
const WORKER_PAGES = ['schedule', 'my-shifts', 'availability', 'swaps', 'fairness'];
const MANAGER_PAGES = [...WORKER_PAGES, 'swaps/approvals', 'team', 'settings'];

async function visitEach({ page, problems }, paths) {
  for (const path of paths) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first(), `${path} has rendered`).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(problems.failedLoads, `failed requests on ${path}`).toEqual([]);
    expect(problems.consoleErrors, `console errors on ${path}`).toEqual([]);
    expect(problems.serverErrors, `5xx responses on ${path}`).toEqual([]);
    expect(problems.pageErrors, `uncaught errors on ${path}`).toEqual([]);
  }
}

test('signed out: every public page', async ({ sessions }) => {
  await visitEach(await sessions.anonymous(), PUBLIC_PAGES);
});

test('a worker: every page in the app', async ({ sessions }) => {
  await visitEach(await sessions.open(asha), WORKER_PAGES.map((name) => appPath(name)));
});

test('a manager: every page in the app', async ({ sessions }) => {
  await visitEach(await sessions.open(manager), MANAGER_PAGES.map((name) => appPath(name)));
});
