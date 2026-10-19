// 08-offer-and-withdraw.spec.js
// Milestones 7 and 7.5: a worker offers a shift from My Shifts, with a note
// and with what they would take in return; finds it on the Swaps page and
// searches it; then withdraws it again. And a choosy offer, widened, turns
// its chain into a direct swap - then is put back as it was.
//
// These change swap data, so they run after the read-only swap checks (07),
// whose demo cases a new or changed offer could alter. Each puts things back,
// so the specs after them see the pool the seed made.

import { test, expect } from '../support/test.js';
import { stack, appPath } from '../support/stack.js';
import { asha } from '../support/people.js';
import { apiAs } from '../support/api.js';
import { findSwapCases, findSwapsForMyOffer, shiftTitleOf } from '../support/swaps.js';

const NOTE = 'Dentist appointment - any swap considered.';

test('a worker offers a shift with a note, finds it on Swaps, and withdraws it', async ({ sessions }) => {
  const { page } = await sessions.open(asha, { path: appPath('my-shifts') });

  // Her first shift still to come; its label names the day and the shift.
  const offer = page.getByRole('button', { name: /^Offer this shift: / }).first();
  await expect(offer).toBeVisible();
  const label = (await offer.getAttribute('aria-label')).replace('Offer this shift: ', '');

  await offer.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Offer this shift?' })).toBeVisible();
  await expect(dialog.getByText(label)).toBeVisible();
  await dialog.getByLabel('Note (optional)').fill(NOTE);
  await dialog.getByRole('radio', { name: 'Only some shifts' }).check();
  await dialog.getByRole('checkbox', { name: 'Night' }).check();
  await dialog.getByRole('button', { name: 'Offer shift' }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'Shift offered' })).toBeVisible();
  await expect(dialog).toHaveCount(0);
  const withdraw = page.getByRole('button', { name: `Withdraw offer: ${label}` });
  await expect(page.getByRole('listitem').filter({ has: withdraw }).getByText('Offered for a swap')).toBeVisible();

  // On the Swaps page it is one of her offers, note and all, and it can be searched.
  await page.goto(appPath('swaps'));
  const mine = page.getByRole('region', { name: 'My offers' });
  await expect(mine.getByText(NOTE)).toBeVisible();
  await expect(mine.getByText('Would take: Night shifts')).toBeVisible();
  await mine.getByRole('button', { name: `Find swaps: ${label}` }).click();
  await expect(page.getByRole('heading', { level: 2, name: /^Swaps for your / })).toBeVisible();
  await expect(page.getByText(/^Checked \d+ other open offers?\./)).toBeVisible();

  // Withdrawn from My Shifts, it can be offered again, and is gone everywhere else.
  await page.goto(appPath('my-shifts'));
  await page.getByRole('button', { name: `Withdraw offer: ${label}` }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Offer withdrawn' })).toBeVisible();
  await expect(page.getByRole('button', { name: `Offer this shift: ${label}` })).toBeVisible();

  await page.goto(appPath('swaps'));
  await expect(page.getByRole('heading', { name: 'You have not offered any shifts' })).toBeVisible();

  const api = await apiAs(asha);
  const { body } = await api.get(`/orgs/${stack().orgId}/swap-requests`);
  await api.dispose();
  expect(body.swapRequests, 'her open requests, as the server sees them').toEqual([]);
});

test('widening what an offer would take turns its chain into a direct swap, and back again', async ({ sessions }) => {
  const { chain } = await findSwapCases();
  const [only] = chain.request.acceptableShiftFilters.categories;
  const { page } = await sessions.open(chain.person, { path: appPath('swaps') });
  const change = page.getByRole('button', { name: `Change offer: ${shiftTitleOf(chain.request.assignment)}` });
  const dialog = page.getByRole('dialog');

  await change.click();
  await dialog.getByRole('radio', { name: "Any shift I'm free for" }).check();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Changes saved' })).toBeVisible();
  await findSwapsForMyOffer(page, chain.request);
  await expect(page.getByRole('region', { name: 'Direct swaps' })).toBeVisible();

  // Put it back as the seed made it.
  await change.click();
  await dialog.getByRole('radio', { name: 'Only some shifts' }).check();
  await dialog.getByRole('checkbox', { name: `${only.charAt(0).toUpperCase()}${only.slice(1)}` }).check();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('region', { name: 'My offers' }).getByText(/^Would take: \w+ shifts$/)).toBeVisible();
});
