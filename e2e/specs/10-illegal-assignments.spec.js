// 10-illegal-assignments.spec.js
// Checklist section: "Illegal assignments" - minimum rest, double booking,
// declared unavailability and qualification, each blocked with a reason that
// names the rule.
//
// Each is checked twice: in the assign dialog, which must show the reason
// and keep Save disabled, and at the API, which must refuse the save with a
// 409 naming the same rule - the dialog is a courtesy, the server is the
// guard. Cases are found in the draft as it is now, so the checks do not
// depend on what an earlier spec generated.

import { test, expect } from '../support/test.js';
import { stack, appPath } from '../support/stack.js';
import { manager, grace } from '../support/people.js';
import { apiAs } from '../support/api.js';
import { loadRoster, tryToSave } from '../support/assignments.js';
import { showRoster, tryShift, addDays, firstWeekday, THURSDAY } from '../support/schedule.js';

let api;
let draft;
let lookups;

test.beforeAll(async () => {
  draft = stack().draft;
  api = await apiAs(manager);
  lookups = await loadRoster(api, draft);
});

test.afterAll(async () => {
  await api.dispose();
});

/** Opens the cell as a manager would, picks the shift, and checks the verdict. */
async function expectBlockedInDialog(sessions, memberName, date, shiftName, reason) {
  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await showRoster(page, draft);
  const dialog = await tryShift(page, draft, memberName, date, shiftName);
  // first(): one shift can break the same rule twice - too little rest
  // before it and after it - and the dialog then lists the message twice.
  await expect(dialog.getByText(reason).first()).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled();
}

test('minimum rest: a day shift straight after an evening', async ({ sessions }) => {
  const evening = lookups.assignments.find((a) => a.shiftTemplateId === lookups.templateId('Evening') && a.date < draft.endDate);
  const nextDay = addDays(evening.date, 1);

  await expectBlockedInDialog(sessions, lookups.memberName(evening.membershipId), nextDay, 'Day', 'Only 8h rest between shifts, minimum is 11h.');

  const refusal = await tryToSave(api, draft, lookups, { membershipId: evening.membershipId, shiftName: 'Day', date: nextDay });
  expect(refusal.status).toBe(409);
  expect(refusal.codes).toContain('MIN_REST');
});

test('double booking: a second, overlapping shift for the same person', async ({ sessions }) => {
  const existing = lookups.assignments[0];
  const shiftName = lookups.templateName(existing.shiftTemplateId);

  // The grid has one cell per person per day: opening a filled cell offers to
  // change or clear that shift, never to add a second one beside it.
  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await showRoster(page, draft);
  const dialog = await tryShift(page, draft, lookups.memberName(existing.membershipId), existing.date, shiftName);
  await expect(dialog.getByRole('button', { name: 'Clear shift' })).toBeVisible();

  // So the server is what has to stop it.
  const refusal = await tryToSave(api, draft, lookups, { membershipId: existing.membershipId, shiftName, date: existing.date });
  expect(refusal.status).toBe(409);
  expect(refusal.codes).toContain('DOUBLE_BOOKED');
  expect(refusal.message).toBe('Assigned to two shifts that overlap in time.');
});

test('declared unavailability: Grace on a Thursday', async ({ sessions }) => {
  const thursday = firstWeekday(draft, THURSDAY);

  await expectBlockedInDialog(sessions, grace.name, thursday, 'Day', `Declared unavailable on ${thursday}.`);

  const refusal = await tryToSave(api, draft, lookups, { membershipId: lookups.memberId(grace.name), shiftName: 'Day', date: thursday });
  expect(refusal.status).toBe(409);
  expect(refusal.codes).toContain('DECLARED_UNAVAILABLE');
});

test('qualification: the ward manager, who holds none, on a day shift', async ({ sessions }) => {
  await expectBlockedInDialog(sessions, manager.name, draft.startDate, 'Day', 'Not qualified for this shift.');

  const refusal = await tryToSave(api, draft, lookups, { membershipId: lookups.memberId(manager.name), shiftName: 'Day', date: draft.startDate });
  expect(refusal.status).toBe(409);
  expect(refusal.codes).toContain('QUALIFICATION_MISMATCH');
});
