// 03-api-unreachable.spec.js
// When the API cannot be reached mid-session, a page says so - "Cannot reach
// the Relay API." with Try again - instead of going blank, and Try again
// brings the page back once the API answers again. The API is cut off in
// this browser only (every /api request refused at the network level), not
// stopped, so the rest of the suite is untouched.
//
// Read-only. The browser logs each refused request as a console error; those
// are expected here, so they alone are taken out of the session's checks.

import { test, expect } from '../support/test.js';
import { appPath } from '../support/stack.js';
import { asha } from '../support/people.js';

const REFUSED = /net::ERR_CONNECTION_REFUSED|net::ERR_FAILED/;

test('the API unreachable mid-session: a message and Try again, never a blank page', async ({ sessions }) => {
  const { page, problems } = await sessions.open(asha, { path: appPath('swaps') });
  await expect(page.getByRole('heading', { level: 1, name: 'Swaps' })).toBeVisible();

  await page.route('**/api/**', (route) => route.abort('connectionrefused'));
  await page.getByRole('navigation').getByRole('link', { name: 'Fairness', exact: true }).click();
  await expect(page.getByText('Cannot reach the Relay API.')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'Fairness' })).toBeVisible();
  const tryAgain = page.getByRole('main').getByRole('button', { name: 'Try again' });
  await expect(tryAgain).toBeVisible();

  await page.unroute('**/api/**');
  await tryAgain.click();
  await expect(page.getByText('Cannot reach the Relay API.')).toBeHidden({ timeout: 20_000 });
  await expect(tryAgain).toHaveCount(0);

  // Each refused request was logged by the browser - that was the point.
  const unexpected = problems.consoleErrors.filter((line) => !REFUSED.test(line));
  problems.consoleErrors.splice(0, problems.consoleErrors.length, ...unexpected);
});
