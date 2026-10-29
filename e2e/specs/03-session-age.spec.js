// 03-session-age.spec.js
// Relay ends every sign-in 7 days after it began, however busy it has been
// (frontend/src/lib/auth/sessionAge.js) - Supabase's free plan would let it
// run until sign-out. In a real browser, with the time of signing in moved
// back by hand:
//
//   six days ago     a reload keeps the person signed in
//   eight days ago   the reload signs them out, the session is gone from the
//                    browser, and the login page says why
//
// Read-only, so it runs with the early specs.

import { test, expect } from '../support/test.js';
import { appPath } from '../support/stack.js';
import { asha } from '../support/people.js';

const DAY = 24 * 60 * 60 * 1000;

function signedInDaysAgo(page, days) {
  return page.evaluate((at) => window.localStorage.setItem('relay-signed-in-at', String(at)), Date.now() - days * DAY);
}

test('a sign-in six days old survives a reload', async ({ sessions }) => {
  const { page } = await sessions.open(asha, { path: appPath('my-shifts') });
  await signedInDaysAgo(page, 6);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(appPath('my-shifts'));
});

test('a sign-in over seven days old is ended as the app loads, and the login page says why', async ({ sessions }) => {
  const { page } = await sessions.open(asha, { path: appPath('my-shifts') });
  await signedInDaysAgo(page, 8);
  await page.reload();

  await page.waitForURL((url) => url.pathname === '/login');
  await expect(page.getByText('You were signed out because sign-ins last 7 days.')).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('relay-auth'))).toBeNull();
});
