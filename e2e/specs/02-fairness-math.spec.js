// 02-fairness-math.spec.js
// Checklist section: "Fairness math for one worker" - count that worker's
// nights and weekends from the published assignments in the window, and
// compare with their ledger row.
//
// support/shifts.js does the counting independently of the app: it
// re-derives the ledger's definitions from raw assignments rather than
// calling its code. The worker is Hiro Tanaka, who works plenty of nights and
// weekends, so a miscount has somewhere to show.

import { test, expect } from '../support/test.js';
import { stack, appPath } from '../support/stack.js';
import { hiro, manager } from '../support/people.js';
import { apiAs } from '../support/api.js';
import { countShifts } from '../support/shifts.js';
import { recordNumbers } from '../support/artifacts.js';
import { WARD } from '../../backend/scripts/demo/ward.js';

test("Hiro Tanaka's ledger row matches his published shifts", async ({ sessions }, testInfo) => {
  const { orgId } = stack();
  const api = await apiAs(manager);

  const fairness = (await api.get(`/orgs/${orgId}/fairness`)).body;
  const row = fairness.rows.find((r) => r.name === hiro.name);
  const { startDate, endDate } = fairness.window;

  const { templates } = (await api.get(`/orgs/${orgId}/shift-templates`)).body;
  const categoryOf = new Map(templates.map((t) => [String(t._id), t.category]));

  const { rosters } = (await api.get(`/orgs/${orgId}/rosters`)).body;
  const inWindow = rosters.filter((r) => r.status === 'published' && r.startDate <= endDate && r.endDate >= startDate);
  const shifts = [];
  for (const roster of inWindow) {
    const { assignments } = (await api.get(`/orgs/${orgId}/rosters/${roster.id}`)).body;
    shifts.push(...assignments.filter((a) => a.membershipId === row.membershipId && a.date >= startDate && a.date <= endDate));
  }
  await api.dispose();

  const counted = countShifts(shifts, { categoryOf, timezone: WARD.timezone });
  const ledger = { shifts: row.shiftsWorked, nights: row.shiftCounts.night, weekends: row.shiftCounts.weekend, hours: row.hoursWorked };
  recordNumbers(testInfo, 'fairness-math', { worker: hiro.name, window: fairness.window, rosters: inWindow.length, counted, ledger });

  expect(inWindow, 'the four published weeks are all in the window').toHaveLength(4);
  expect(counted.nights, 'nights').toBe(ledger.nights);
  expect(counted.weekends, 'weekend shifts').toBe(ledger.weekends);
  expect(counted.shifts, 'shifts').toBe(ledger.shifts);
  expect(counted.hours, 'hours').toBe(ledger.hours);

  // And the manager's Fairness page shows those same numbers in his row.
  const { page } = await sessions.open(manager, { path: appPath('fairness') });
  const cells = page.getByRole('row').filter({ has: page.getByRole('cell', { name: hiro.name, exact: true }) }).getByRole('cell');
  await expect(cells.nth(2), 'Nights column').toHaveText(String(counted.nights));
  await expect(cells.nth(3), 'Weekends column').toHaveText(String(counted.weekends));
});
