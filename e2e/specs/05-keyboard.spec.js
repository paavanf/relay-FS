// 05-keyboard.spec.js
// Checklist section: "Keyboard" - Tab reaches a grid cell, Enter opens the
// dialog, Escape closes it, and focus returns to the same cell.
//
// "The same cell" is checked by identity: the focused cell is marked before
// Enter, and the element holding focus after Escape must carry that mark.
// Whether focus moved into the dialog while it was open is recorded too.

import { test, expect } from '../support/test.js';
import { stack, appPath } from '../support/stack.js';
import { manager } from '../support/people.js';
import { showRoster } from '../support/schedule.js';

const MAX_TABS = 40;

test('the grid can be worked from the keyboard', async ({ sessions }, testInfo) => {
  const { draft } = stack();
  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await showRoster(page, draft);

  // Start from the roster picker, just above the grid, and Tab forward.
  await page.getByLabel('Choose a roster').focus();
  let presses = 0;
  let onCell = false;
  while (!onCell && presses < MAX_TABS) {
    await page.keyboard.press('Tab');
    presses += 1;
    onCell = await page.evaluate(() => {
      const focused = document.activeElement;
      return focused?.tagName === 'BUTTON' && Boolean(focused.closest('table'));
    });
  }
  expect(onCell, `a grid cell has focus within ${MAX_TABS} Tab presses`).toBe(true);
  await page.evaluate(() => {
    document.activeElement.dataset.e2eMark = 'the-cell';
  });

  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const focusInsideDialog = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')));

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  const focusedMark = await page.evaluate(() => document.activeElement?.dataset.e2eMark ?? null);

  expect(focusedMark, 'focus is back on the cell that opened the dialog').toBe('the-cell');

  // Recorded, not asserted - it is beyond the checklist: with the dialog
  // open, where does one more Tab take a keyboard user?
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Tab');
  const tabWithDialogOpen = await page.evaluate(() => {
    const focused = document.activeElement;
    if (focused?.closest('[role="dialog"]')) return 'into the dialog';
    return focused?.closest('table') ? 'to the next grid cell, behind the dialog' : `to ${focused?.tagName}`;
  });
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  testInfo.annotations.push({
    type: 'keyboard',
    description: JSON.stringify({ tabPresses: presses, focusInsideDialogWhenOpened: focusInsideDialog, tabWithDialogOpen }),
  });
});
