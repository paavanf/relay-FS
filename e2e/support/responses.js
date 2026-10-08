// responses.js
// Reading the raw body of a response the page itself receives.
//
// First the page must have finished loading that data: `ready` is something
// it only draws once the response has arrived. Then the page is reloaded with
// the wait already armed, so the response read is the reloaded page's own -
// never one still arriving from before, whose body the browser throws away
// the moment the page navigates. (waitForLoadState('networkidle') is no use
// here: after a client-side navigation it has long since fired, and returns
// at once.)

import { expect } from '@playwright/test';

export async function reloadAndRead(page, pathname, ready) {
  await expect(ready).toBeVisible();
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'GET' && new URL(r.url()).pathname === pathname),
    page.reload(),
  ]);
  return response.text();
}
