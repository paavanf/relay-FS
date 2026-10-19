// 15-notifications.spec.js
// Milestone 9: the notification centre, as people use it.
//
//   a roster published   a worker with shifts on it finds it under the bell,
//                        and following it leads to My Shifts
//   mark all as read     clears every dot - the bell and the page agree
//   the keyboard         Enter on the bell opens the panel with focus inside;
//                        Escape closes it and puts focus back on the bell
//
// Changes data - the seed's draft is published - so it runs last. The open
// panel is captured for review: e2e/artifacts/screenshots/notification-panel-*.png.

import { test, expect } from '../support/test.js';
import { stack, appPath } from '../support/stack.js';
import { manager, everyone } from '../support/people.js';
import { apiAs } from '../support/api.js';
import { loadRoster } from '../support/assignments.js';
import { captureAll } from '../support/screens.js';

let worker;

// Publishes the seed's draft, as a manager would, and picks a worker with shifts
// on it. Only once: after a failed test Playwright runs this again in a new worker.
test.beforeAll(async () => {
  const { orgId, draft } = stack();
  const api = await apiAs(manager);
  const lookups = await loadRoster(api, draft);
  worker = everyone.find((p) => p.role === 'member' && lookups.assignments.some((a) => a.membershipId === lookups.memberId(p.name)));
  const { status } = (await api.get(`/orgs/${orgId}/rosters/${draft.id}`)).body.roster;
  const published = status === 'draft' ? await api.post(`/orgs/${orgId}/rosters/${draft.id}/publish`) : null;
  await api.dispose();
  if (published) expect(published.status).toBe(200);
});

const bellOf = (page) => page.getByRole('button', { name: /^Notifications(, \d+ unread)?$/ });

test('a published roster: a worker finds it under the bell, and it leads to My Shifts', async ({ sessions }) => {
  const { page } = await sessions.open(worker, { path: appPath('swaps') });
  await expect(bellOf(page)).toHaveAccessibleName(/^Notifications, \d+ unread$/);
  await bellOf(page).click();

  // This roster's notification, by the day it starts - spec 13 published the week after it.
  const panel = page.getByRole('dialog', { name: 'Notifications' });
  const day = Number(stack().draft.startDate.slice(8, 10));
  const published = panel.getByRole('link', { name: new RegExp(`^Unread: The roster for ${day} .+ is published\\. You have \\d+ shifts? on it\\.`) });
  await expect(published).toBeVisible();
  await captureAll(page, 'notification-panel', { target: panel });
  await published.click();
  await expect(page).toHaveURL(new RegExp(`${appPath('my-shifts')}$`));
  await expect(page.getByRole('heading', { level: 1, name: 'My shifts' })).toBeVisible();
});

test('"Mark all as read" clears every dot, in the bell and on the page', async ({ sessions }) => {
  const { page } = await sessions.open(worker, { path: appPath('notifications') });
  await expect(page.getByRole('heading', { level: 1, name: 'Notifications' })).toBeVisible();
  await bellOf(page).click();
  await page.getByRole('dialog', { name: 'Notifications' }).getByRole('button', { name: 'Mark all as read' }).click();

  await expect(page.getByRole('button', { name: 'Notifications', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByRole('main').getByRole('listitem').first()).toBeVisible();
  await expect(page.getByRole('main').getByText(/^Unread: /)).toHaveCount(0);
});

test('the panel from the keyboard: Enter opens it with focus inside, Escape closes it back to the bell', async ({ sessions }) => {
  const { page } = await sessions.open(worker, { path: appPath('my-shifts') });
  const bell = bellOf(page);
  await bell.focus();
  await page.keyboard.press('Enter');

  const panel = page.getByRole('dialog', { name: 'Notifications' });
  await expect(panel).toBeVisible();
  expect(await panel.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Tab');
  expect(await panel.evaluate((node) => node.contains(document.activeElement))).toBe(true);

  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(bell).toBeFocused();
});
