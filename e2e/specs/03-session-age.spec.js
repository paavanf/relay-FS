// 03-session-age.spec.js
// Relay ends every sign-in 7 days after it began, however busy it has been -
// Supabase's free plan would let it run until sign-out. The browser keeps the
// limit (frontend/src/lib/auth/sessionAge.js), and so does the API, from the
// sign-in time inside the token (backend/src/services/identity/signInAge.js).
// In a real browser, with the time of signing in moved back by hand:
//
//   six days ago     a reload keeps the person signed in
//   eight days ago   the reload signs them out, the session is gone from the
//                    browser, and the login page says why
//   the API's own    a token signed in eight days ago, in a browser whose
//                    record says it is fresh: the API refuses it
//                    (SESSION_EXPIRED), and the app ends the session the same way
//
// Read-only, so it runs with the early specs.

import { test, expect } from '../support/test.js';
import { appPath, stack } from '../support/stack.js';
import { asha } from '../support/people.js';
import { signTestToken } from '../support/testToken.js';

const DAY = 24 * 60 * 60 * 1000;

function signedInDaysAgo(page, days) {
  return page.evaluate((at) => window.localStorage.setItem('relay-signed-in-at', String(at)), Date.now() - days * DAY);
}

async function expectSignedOutForAge(page) {
  await page.waitForURL((url) => url.pathname === '/login');
  await expect(page.getByText('You were signed out because sign-ins last 7 days.')).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('relay-auth'))).toBeNull();
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
  await expectSignedOutForAge(page);
});

test('the API refuses a token signed in over seven days ago, whatever the browser thinks', async ({ sessions }) => {
  const { page } = await sessions.open(asha, { path: appPath('my-shifts') });
  const signedInAt = Date.now() - 8 * DAY;
  const accessToken = signTestToken(asha.email, stack().authSecret, { signedInAt });
  await page.evaluate(
    ({ token, at }) => {
      const session = JSON.parse(window.localStorage.getItem('relay-auth'));
      window.localStorage.setItem('relay-auth', JSON.stringify({ ...session, accessToken: token, signedInAt: at }));
    },
    { token: accessToken, at: signedInAt },
  );

  await page.reload();
  await expectSignedOutForAge(page);
});
