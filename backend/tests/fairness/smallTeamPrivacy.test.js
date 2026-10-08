// smallTeamPrivacy.test.js
// With fewer than three people measured, a worker's response must not carry
// the team average or their deviation from it: from your own figure and the
// average of two, the other person's figure follows exactly. Asserted on the
// raw JSON, so nothing can hide in a field the page happens not to show.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { join } from '../helpers/orgBuilder.js';
import { auth, buildTeam, makeRoster, addShifts } from './team.js';

let app;
let team;
const WEEK = ['2026-03-02', '2026-03-03', '2026-03-04'];

const fairness = (token) => request(app).get(`/api/v1/orgs/${team.orgId}/fairness`).set(auth(token));

async function publishWeek(extra = []) {
  const roster = await makeRoster(team, { startDate: '2026-03-02', endDate: '2026-03-08', status: 'published' });
  await addShifts(team, roster, team.ids.nadia, 'night', WEEK);
  await addShifts(team, roster, team.ids.desmond, 'day', WEEK);
  for (const membershipId of extra) await addShifts(team, roster, membershipId, 'day', WEEK.slice(0, 2));
  await request(app).post(`/api/v1/orgs/${team.orgId}/fairness/recompute`).set(auth(team.tokens.owner));
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

describe('fairness in a small team', () => {
  it('withholds the average and the comparison from a worker when only two are measured', async () => {
    await publishWeek();
    const res = await fairness(team.tokens.nadia);

    expect(res.body.comparison).toEqual({ available: false, minimumMeasured: 3 });
    expect(res.body.you.normalisedBurden).toBeGreaterThan(0);
    expect(res.text).not.toContain('teamAverage');
    expect(res.text).not.toContain('deviationPercent');
  });

  it('shows them once three people are measured', async () => {
    const third = await join(app, { orgId: team.orgId, ownerToken: team.tokens.owner, name: 'Tara Third', email: 'tara@example.com' });
    await publishWeek([third.membershipId]);
    const res = await fairness(team.tokens.nadia);

    expect(res.body.comparison.available).toBe(true);
    expect(res.body.teamAverage.normalisedBurden).toBeGreaterThan(0);
    expect(res.body.you.deviationPercent).toBeGreaterThan(0);
  });

  it('leaves managers unaffected', async () => {
    await publishWeek();
    const res = await fairness(team.tokens.owner);

    expect(res.body.teamAverage.normalisedBurden).toBeGreaterThan(0);
    expect(res.body.rows.every((row) => 'deviationPercent' in row)).toBe(true);
  });
});
