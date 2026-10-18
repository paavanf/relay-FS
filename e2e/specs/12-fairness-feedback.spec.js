// 12-fairness-feedback.spec.js
// Checklist section: "Fairness feedback" - take the three people most over
// their share and the three most under, generate the next draft, and compare
// how many heavy shifts (nights plus weekends) each group gets in it.
//
// This is a trend, not a promise about any one person, so nothing here
// asserts which way it goes - qualifications, contracts and availability
// shape who can take a night long before fairness does. The numbers are
// measured and recorded (e2e/artifacts/numbers/fairness-feedback.json) for
// the report. What is asserted is only that the comparison really ran.

import { test, expect } from '../support/test.js';
import { stack, appPath } from '../support/stack.js';
import { manager } from '../support/people.js';
import { apiAs } from '../support/api.js';
import { showRoster } from '../support/schedule.js';
import { countShifts, average } from '../support/shifts.js';
import { recordNumbers } from '../support/artifacts.js';
import { WARD } from '../../backend/scripts/demo/ward.js';
import { WEEKS_BEFORE, WEEKS_AHEAD, DRAFT_DAYS } from '../../backend/scripts/demo/dates.js';

// Every published week is history to the ledger, the ones ahead included.
const HISTORY_WEEKS = WEEKS_BEFORE + 1 + WEEKS_AHEAD;
const DRAFT_WEEKS = DRAFT_DAYS / 7;

test('heavy shifts in the next draft, for the most over and the most under', async ({ sessions }, testInfo) => {
  const { orgId, draft } = stack();
  const api = await apiAs(manager);
  const fairness = (await api.get(`/orgs/${orgId}/fairness`)).body;
  const measured = fairness.rows.filter((r) => r.measured).sort((a, b) => b.deviationPercent - a.deviationPercent);
  const groups = { over: measured.slice(0, 3), under: measured.slice(-3).reverse() };

  // Generate the next draft through the app, the way a manager would.
  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await showRoster(page, draft);
  await page.getByRole('button', { name: 'Generate roster' }).click();
  await page.getByRole('button', { name: 'Replace and generate' }).click();
  await expect(page.getByText(/^(Every shift is covered - \d+ filled|\d+ of \d+ shifts filled)/)).toBeVisible({ timeout: 90_000 });

  const { assignments } = (await api.get(`/orgs/${orgId}/rosters/${draft.id}`)).body;
  const { templates } = (await api.get(`/orgs/${orgId}/shift-templates`)).body;
  await api.dispose();
  const categoryOf = new Map(templates.map((t) => [String(t._id), t.category]));

  const describe = (row) => {
    const next = countShifts(assignments.filter((a) => a.membershipId === row.membershipId), { categoryOf, timezone: WARD.timezone });
    const before = row.shiftCounts.night + row.shiftCounts.weekend;
    return {
      name: row.name,
      deviationPercent: row.deviationPercent,
      contractedHoursPerWeek: row.contractedHoursPerWeek,
      heavyPerWeekBefore: Math.round((before / HISTORY_WEEKS) * 100) / 100,
      heavyInDraft: next.heavy,
      heavyPerWeekInDraft: next.heavy / DRAFT_WEEKS,
      shiftsInDraft: next.shifts,
    };
  };
  const summary = (rows) => {
    const people = rows.map(describe);
    return { people, averageHeavyInDraft: average(people.map((p) => p.heavyInDraft)), averageHeavyPerWeekBefore: average(people.map((p) => p.heavyPerWeekBefore)) };
  };
  const numbers = { window: fairness.window, over: summary(groups.over), under: summary(groups.under) };
  recordNumbers(testInfo, 'fairness-feedback', numbers);

  expect(new Set([...groups.over, ...groups.under].map((r) => r.membershipId)).size, 'six different people').toBe(6);
  expect(groups.over.every((r) => r.deviationPercent > 0), 'the "over" group is over').toBe(true);
  expect(groups.under.every((r) => r.deviationPercent < 0), 'the "under" group is under').toBe(true);
  expect(assignments.length, 'the new draft has shifts').toBeGreaterThan(0);
});
