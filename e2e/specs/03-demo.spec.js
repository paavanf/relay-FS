// 03-demo.spec.js
// Milestone 10a: the public demo, as a visitor meets it. The suite builds the
// frontend in demo mode (VITE_DEMO_MODE=true), and its seeded ward is the
// shared demo organisation, so this is the deployed demo in miniature:
//
//   the landing page   offers "Try the demo" instead of "Log in"
//   the login page     lists the three demo accounts; each button signs
//                      straight in, to the demo with its banner across it
//   a locked control   stays focusable, does nothing, and says why on hover
//                      and on focus
//
// Read-only - signing in changes nothing - so it runs with the early specs,
// before the swap specs change the seeded proposals.

import { test, expect } from '../support/test.js';
import { captureAll } from '../support/screens.js';

const BANNER = 'Shared demo — resets every night. Some settings are locked.';
const ACCOUNTS = ['the owner', 'a worker with a swap waiting', 'a worker with a direct swap'];

test('the landing page offers the demo, and the login page lists its three accounts', async ({ sessions }) => {
  const { page } = await sessions.anonymous();
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Log in' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Try the demo' }).first().click();

  await expect(page).toHaveURL(/\/login$/);
  const demo = page.getByRole('region', { name: 'Try the demo' });
  for (const who of ACCOUNTS) await expect(demo.getByRole('button', { name: `Sign in as ${who}` })).toBeVisible();
  await captureAll(page, 'try-the-demo', { target: demo });
});

for (const who of ACCOUNTS) {
  test(`"Sign in as ${who}" signs straight in, to the demo and its banner`, async ({ sessions }) => {
    const { page } = await sessions.anonymous();
    await page.goto('/login');
    await page.getByRole('button', { name: `Sign in as ${who}` }).click();

    await expect(page).toHaveURL(/\/app\/[0-9a-f]{24}\//);
    await expect(page.getByText(BANNER)).toBeVisible();
  });
}

test('a locked control stays focusable, does nothing, and says why', async ({ sessions }) => {
  const { page } = await sessions.anonymous();
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign in as the owner' }).click();
  await expect(page).toHaveURL(/\/app\/[0-9a-f]{24}\/schedule$/);
  await page.getByRole('link', { name: 'Team' }).first().click();

  const invite = page.getByRole('button', { name: 'Invite member' });
  await expect(invite).toHaveAttribute('aria-disabled', 'true');
  await expect(invite).toHaveAccessibleDescription(/^This is a shared demo, so this setting is locked\./);

  await invite.focus();
  await expect(page.getByRole('tooltip')).toBeVisible();
  // Playwright will not click an aria-disabled control on its own; forced, the click does nothing.
  await invite.click({ force: true });
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
