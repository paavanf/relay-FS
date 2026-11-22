// 03-offline.spec.js
// Losing the connection mid-session, in a real browser: a note says so, a
// page that cannot be downloaded says it could not load - in plain words, not
// the browser's - and when the connection is back the page loads by itself
// and the note goes. Offline is this browser context's only (setOffline).
//
// Read-only. The browser logs each request it could not send, and the page
// it could not download, as console errors; those are expected here, so they
// alone are taken out of the session's checks.

import { test, expect } from '../support/test.js';
import { appPath } from '../support/stack.js';
import { asha } from '../support/people.js';

const OFFLINE = /ERR_INTERNET_DISCONNECTED|dynamically imported module|Failed to load module script/;
const NOTE = 'You are offline. Relay will carry on when you are back online.';

test('offline mid-session: said plainly, and back by itself when online', async ({ sessions }) => {
  const { context, page, problems } = await sessions.open(asha, { path: appPath('swaps') });
  await expect(page.getByRole('heading', { level: 1, name: 'Swaps' })).toBeVisible();

  await context.setOffline(true);
  await expect(page.getByText(NOTE)).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Availability', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'This page could not be loaded' })).toBeVisible();
  await expect(page.getByText(/dynamically imported module/)).toHaveCount(0);

  await context.setOffline(false);
  await expect(page.getByRole('heading', { level: 1, name: 'Availability' })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(NOTE)).toHaveCount(0);

  const unexpected = problems.consoleErrors.filter((line) => !OFFLINE.test(line));
  problems.consoleErrors.splice(0, problems.consoleErrors.length, ...unexpected);
  const pageErrors = problems.pageErrors.filter((line) => !OFFLINE.test(line));
  problems.pageErrors.splice(0, problems.pageErrors.length, ...pageErrors);
});
