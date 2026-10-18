// 11-stale-save.spec.js
// Checklist section: "Race condition" - two managers on the same draft; the
// stale save shows a clear error, not a crash.
//
// The owner and the manager, each in a browser context of their own, open
// the same empty cell and pick the same shift. Both are told it is valid -
// at that moment it is. The owner saves first. The manager's save is now
// stale, and the server must refuse it with a reason the manager can read,
// while their page carries on working.

import { test, expect } from '../support/test.js';
import { stack, appPath } from '../support/stack.js';
import { owner, manager } from '../support/people.js';
import { apiAs } from '../support/api.js';
import { showRoster, tryShift, cellButton } from '../support/schedule.js';

/** An empty cell where a day shift would be legal right now, asked of the API's dry run. */
async function findOpenCell(api) {
  const { orgId, draft } = stack();
  const { assignments } = (await api.get(`/orgs/${orgId}/rosters/${draft.id}`)).body;
  const { members } = (await api.get(`/orgs/${orgId}/members`)).body;
  const { templates } = (await api.get(`/orgs/${orgId}/shift-templates`)).body;
  const day = String(templates.find((t) => t.name === 'Day')._id);
  const taken = new Set(assignments.map((a) => `${a.membershipId}|${a.date}`));
  const dates = [...new Set(assignments.map((a) => a.date))].sort();

  // Only people who hold a qualification can take any shift at all.
  for (const member of members.filter((m) => m.qualificationIds.length > 0)) {
    for (const date of dates) {
      if (taken.has(`${member.id}|${date}`)) continue;
      const verdict = (await api.post(`/orgs/${orgId}/assignments/validate`, { rosterId: draft.id, membershipId: member.id, shiftTemplateId: day, date })).body;
      if (verdict.allowed) return { member, date };
    }
  }
  throw new Error('no cell in the draft where a day shift would be legal');
}

test('the second of two managers saving the same cell gets a clear refusal', async ({ sessions }) => {
  const { orgId, draft } = stack();
  const api = await apiAs(owner);
  const { member, date } = await findOpenCell(api);

  const first = await sessions.open(owner, { path: appPath('schedule') });
  const second = await sessions.open(manager, { path: appPath('schedule') });
  const dialogs = [];
  for (const { page } of [first, second]) {
    await showRoster(page, draft);
    const dialog = await tryShift(page, draft, member.name, date, 'Day');
    await expect(dialog.getByText('This assignment is valid.')).toBeVisible();
    dialogs.push(dialog);
  }

  await dialogs[0].getByRole('button', { name: 'Save' }).click();
  await expect(first.page.getByRole('alert').filter({ hasText: 'Shift saved' })).toBeVisible();

  await dialogs[1].getByRole('button', { name: 'Save' }).click();
  const refusal = second.page.getByRole('alert').filter({ hasText: 'Could not save' });
  await expect(refusal).toBeVisible();
  await expect(refusal).toContainText('Assigned to two shifts that overlap in time.');

  // Not a crash: the page is still there and still usable.
  await expect(dialogs[1]).toBeVisible();
  await dialogs[1].getByRole('button', { name: 'Cancel' }).click();
  await expect(second.page.getByRole('table')).toBeVisible();
  expect(second.problems.failedLoads.some((line) => line.startsWith('409'))).toBe(true);

  // And the refusal is explained by what the grid now shows: the second
  // manager's grid catches up with the owner's shift, rather than leaving an
  // empty cell that the toast says is taken.
  await expect(cellButton(second.page, draft, member.name, date)).toContainText('Day');

  // And the server kept exactly one shift in that cell.
  const { assignments } = (await api.get(`/orgs/${orgId}/rosters/${draft.id}`)).body;
  expect(assignments.filter((a) => a.membershipId === member.id && a.date === date)).toHaveLength(1);
  await api.dispose();
});
