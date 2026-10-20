// 03-first-visit.spec.js
// Milestone 10b: what a first visit asks of the API. The deployed backend
// sleeps when nobody uses it, so the login and register pages each send one
// GET /api/v1/health as they open - the server starts waking while the form
// is filled in. The landing page still asks the API nothing at all.
//
// The suite serves the build with vercel.json's security headers, so these
// pages - like every page in every spec - also load under the production
// Content-Security-Policy; a blocked script or style is a console error,
// and fails the test.
//
// Read-only, so it runs with the early specs.

import { test, expect } from '../support/test.js';

/** Every API request the page makes from now on, as 'GET /api/v1/health'. */
function watchApi(page) {
  const seen = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/')) seen.push(`${request.method()} ${url.pathname}`);
  });
  return seen;
}

async function open(page, path) {
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await page.waitForLoadState('networkidle');
}

test('the landing page asks the API nothing', async ({ sessions }) => {
  const { page } = await sessions.anonymous();
  const seen = watchApi(page);
  await open(page, '/');
  expect(seen).toEqual([]);
});

for (const path of ['/login', '/register']) {
  test(`${path} sends one GET /api/v1/health as it opens, to wake the server`, async ({ sessions }) => {
    const { page } = await sessions.anonymous();
    const seen = watchApi(page);
    await open(page, path);
    expect(seen).toEqual(['GET /api/v1/health']);
  });
}
