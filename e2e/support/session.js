// session.js
// Signs someone in through the real login page, in a browser context of their
// own - separate cookies, separate storage - so a manager and a worker can be
// on screen side by side, or two managers can race each other.
//
// The login page's own ?next= support sends each person straight to the
// page the spec wants, as an invite link would.

import { stack } from './stack.js';
import { PASSWORD } from './people.js';
import { watchProblems } from './problems.js';

export const DESKTOP = { width: 1440, height: 900 };
export const PHONE = { width: 375, height: 812 };

/** who = null opens a signed-out context. */
export async function openSession(browser, who, { path, viewport = DESKTOP, colorScheme = 'light' } = {}) {
  const context = await browser.newContext({ baseURL: stack().baseURL, viewport, colorScheme });
  const problems = watchProblems(context);
  const page = await context.newPage();

  if (who) {
    const target = path ?? `/app/${stack().orgId}/schedule`;
    await page.goto(`/login?next=${encodeURIComponent(target)}`);
    await page.getByLabel('Email', { exact: true }).fill(who.email);
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL((url) => url.pathname === target);
  }

  return { who, context, page, problems };
}
