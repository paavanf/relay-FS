// 10-assignment-roles.spec.js
// Milestone 7.5: assigning someone by hand means choosing which role on the
// shift they fill. Only roles the person holds are offered, each with how
// many of its places are still open, and when only one fits it is chosen for
// the manager.
//
//   Asha holds Charge Nurse and Registered Nurse: both are offered on a day
//   shift, and with neither left open she is asked which
//   Dara holds Registered Nurse only: it is the one role offered, already
//   chosen, and the rules are checked straight away
//
// Read-only: dialogs are opened and read, and nothing is saved. Runs before
// 10-illegal-assignments, which also only reads.

import { test, expect } from '../support/test.js';
import { stack, appPath } from '../support/stack.js';
import { manager, asha, everyone } from '../support/people.js';
import { apiAs } from '../support/api.js';
import { loadRoster } from '../support/assignments.js';
import { showRoster, cellButton, daysBetween, addDays } from '../support/schedule.js';

const dara = everyone.find((p) => p.key === 'dara');

// A date in the draft with no shift for this person: an empty cell to open.
function freeDay(lookups, draft, name) {
  const busy = new Set(lookups.assignments.filter((a) => a.membershipId === lookups.memberId(name)).map((a) => a.date));
  const dates = Array.from({ length: daysBetween(draft.startDate, draft.endDate) + 1 }, (_, i) => addDays(draft.startDate, i));
  return dates.find((date) => !busy.has(date));
}

test("a manager picks the role on the shift, and someone with one role has it picked for them", async ({ sessions }) => {
  const { draft } = stack();
  const api = await apiAs(manager);
  const lookups = await loadRoster(api, draft);
  await api.dispose();

  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await showRoster(page, draft);
  const dialog = page.getByRole('dialog');
  const roles = dialog.getByRole('group', { name: 'Role' });

  await cellButton(page, draft, asha.name, freeDay(lookups, draft, asha.name)).click();
  await dialog.getByRole('radio', { name: /^Day\b/ }).check();
  await expect(roles.getByRole('radio')).toHaveCount(2);
  await expect(roles.getByRole('radio', { name: /^Charge Nurse \d+ of \d+ open$/ })).toBeVisible();
  await expect(dialog.getByText(`Choose which role ${asha.name} fills.`)).toBeVisible();
  // Once the role is chosen, the prompt goes and the rules are checked.
  await roles.getByRole('radio', { name: /^Registered Nurse/ }).check();
  await expect(dialog.getByText(`Choose which role ${asha.name} fills.`)).toBeHidden();
  await expect(dialog.getByText('Checking the rules...')).toBeHidden();
  await page.keyboard.press('Escape');

  await cellButton(page, draft, dara.name, freeDay(lookups, draft, dara.name)).click();
  await dialog.getByRole('radio', { name: /^Day\b/ }).check();
  await expect(roles.getByRole('radio')).toHaveCount(1);
  await expect(roles.getByRole('radio', { name: /^Registered Nurse/ })).toBeChecked();
  await expect(dialog.getByText('Checking the rules...')).toBeHidden();
});
