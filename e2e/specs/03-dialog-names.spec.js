// 03-dialog-names.spec.js
// Every dialog is named by its visible title, so a screen reader says what
// has opened. Opens the dialogs people meet most - New roster, the warning
// before generating over a draft, publishing, a cell of the grid, rejecting
// a swap, proposing one, offering a shift, and the notifications - and finds
// each by its role and name, as a screen reader would.
//
// A swap's approval preview is part of its card on Swap approvals, not a
// dialog; the dialogs beside it - rejecting it, and proposing a swap in the
// first place - are opened instead.
//
// Read-only: every dialog is closed with Escape, and nothing is changed.

import { test, expect } from '../support/test.js';
import { appPath } from '../support/stack.js';
import { manager } from '../support/people.js';
import { findSwapCases, findSwapsForMyOffer, firstOption } from '../support/swaps.js';

async function opensNamed(page, opener, name) {
  await opener.click();
  const dialog = page.getByRole('dialog', { name });
  await expect(dialog, `a dialog named ${name}`).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
}

test('a manager: New roster, generating over a draft, publishing, a cell, rejecting a swap', async ({ sessions }) => {
  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await opensNamed(page, page.getByRole('button', { name: 'New roster' }), 'New roster');
  await opensNamed(page, page.getByRole('button', { name: 'Generate roster' }), 'Replace the current draft?');
  await opensNamed(page, page.getByRole('button', { name: 'Publish', exact: true }), /^Publish .+\?$/);

  // A cell's dialog is named by the person whose cell it is.
  await page.getByRole('button', { name: /, change$/ }).first().click();
  const person = (await page.getByRole('dialog').getByRole('heading', { level: 2 }).innerText()).trim();
  expect(person).not.toBe('');
  await expect(page.getByRole('dialog', { name: person })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto(appPath('swaps/approvals'));
  await opensNamed(page, page.getByRole('button', { name: 'Reject' }).first(), 'Reject this swap?');
});

test('a worker: proposing a swap, offering a shift, the notifications', async ({ sessions }) => {
  const cases = await findSwapCases();
  const { page } = await sessions.open(cases.chain.person, { path: appPath('swaps') });
  await findSwapsForMyOffer(page, cases.chain.request);
  await opensNamed(page, firstOption(page, 'Swap chains').getByRole('button', { name: 'Propose this swap' }), 'Propose this swap?');

  await page.goto(appPath('my-shifts'));
  await opensNamed(page, page.getByRole('button', { name: 'Offer this shift' }).first(), 'Offer this shift?');
  await opensNamed(page, page.getByRole('button', { name: /^Notifications/ }).first(), 'Notifications');
});
