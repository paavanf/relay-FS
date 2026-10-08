// generationFeed.test.js
// loadGenerationInput hands the generator the fairness debt measured on the
// PUBLISHED history that ends the day before the new roster starts.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Organisation } from '../../src/models/index.js';
import { loadGenerationInput } from '../../src/services/roster/loadGenerationInput.service.js';
import { buildTeam, makeRoster, addShifts } from './team.js';

let app;
let team;
const FIRST_WEEK = ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'];
const NEXT_ROSTER = { startDate: '2026-03-09', endDate: '2026-03-15' };

async function debtFor(roster) {
  const org = await Organisation.findById(team.orgId).lean();
  return (await loadGenerationInput({ org, roster })).fairnessDebt;
}

async function publishedFirstWeek() {
  const roster = await makeRoster(team, { startDate: '2026-03-02', endDate: '2026-03-08', status: 'published' });
  await addShifts(team, roster, team.ids.nadia, 'night', FIRST_WEEK);
  await addShifts(team, roster, team.ids.desmond, 'day', FIRST_WEEK);
}

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  team = await buildTeam(app);
});

describe('the fairness debt the generator receives', () => {
  it('is {} for an organisation with no published history', async () => {
    expect(await debtFor(NEXT_ROSTER)).toEqual({});
  });

  it('is positive for whoever carried the heavy shifts before this roster', async () => {
    await publishedFirstWeek();
    const debt = await debtFor(NEXT_ROSTER);

    expect(debt[team.ids.nadia]).toBeGreaterThan(0);
    expect(debt[team.ids.desmond]).toBeLessThan(0);
  });

  it('ignores drafts, and anything from the new roster\'s own first day onwards', async () => {
    await publishedFirstWeek();
    const draft = await makeRoster(team, { startDate: '2026-03-02', endDate: '2026-03-08' });
    await addShifts(team, draft, team.ids.desmond, 'night', FIRST_WEEK);
    const later = await makeRoster(team, { ...NEXT_ROSTER, status: 'published' });
    await addShifts(team, later, team.ids.desmond, 'night', ['2026-03-09', '2026-03-10', '2026-03-11']);

    const debt = await debtFor(NEXT_ROSTER);

    // Desmond's draft nights and his nights from the 9th on do not count.
    expect(debt[team.ids.desmond]).toBeLessThan(0);
    expect(debt[team.ids.nadia]).toBeGreaterThan(0);
  });
});
