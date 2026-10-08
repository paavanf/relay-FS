// 11-publish-with-holes.spec.js
// Checklist section: "Publish with holes" - blocked until the acknowledgement
// is ticked.
//
// Runs last: publishing is the one step that cannot be undone, and it moves
// the fairness window that earlier specs read. The roster is the fixture week
// with holes (stack/fixtures.js), so the holes and their count are real.

import { test, expect } from '../support/test.js';
import { stack, appPath } from '../support/stack.js';
import { manager } from '../support/people.js';
import { apiAs } from '../support/api.js';
import { showRoster } from '../support/schedule.js';

test('a roster with holes cannot be published until the gaps are acknowledged', async ({ sessions }) => {
  const { orgId, holes, holesCount } = stack();
  expect(holesCount, 'the fixture roster has holes').toBeGreaterThan(0);

  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await showRoster(page, holes);
  await page.getByRole('button', { name: 'Publish' }).click();

  const dialog = page.getByRole('dialog');
  const unfilled = holesCount === 1 ? '1 shift is still unfilled.' : `${holesCount} shifts are still unfilled.`;
  await expect(dialog.getByText(unfilled)).toBeVisible();

  const publish = dialog.getByRole('button', { name: 'Publish' });
  await expect(publish).toBeDisabled();

  // Even a click forced onto the disabled button publishes nothing.
  await publish.click({ force: true });
  const api = await apiAs(manager);
  expect((await api.get(`/orgs/${orgId}/rosters/${holes.id}`)).body.roster.status).toBe('draft');

  await dialog.getByLabel('I understand, publish anyway').check();
  await expect(publish).toBeEnabled();
  await publish.click();

  await expect(page.getByRole('alert').filter({ hasText: 'Roster published' })).toBeVisible();
  expect((await api.get(`/orgs/${orgId}/rosters/${holes.id}`)).body.roster.status).toBe('published');
  await api.dispose();
});
