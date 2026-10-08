// fairnessApi.test.js
// GET /orgs/:orgId/fairness and POST /orgs/:orgId/fairness/recompute.
//
// The behaviour worth pinning hardest is privacy: a worker's response must
// contain no other member's id, name or figures - asserted on the raw JSON
// text, so nothing can hide in a field the UI happens not to show.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { auth, buildTeam, makeRoster, addShifts } from './team.js';

let app;
let team;
const WEEK = ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'];

const fairness = (token) => request(app).get(`/api/v1/orgs/${team.orgId}/fairness`).set(auth(token));
const recompute = (token) => request(app).post(`/api/v1/orgs/${team.orgId}/fairness/recompute`).set(auth(token));

async function publishedWeek() {
  const roster = await makeRoster(team, { startDate: '2026-03-02', endDate: '2026-03-08' });
  await addShifts(team, roster, team.ids.nadia, 'night', WEEK);
  await addShifts(team, roster, team.ids.desmond, 'day', WEEK);
  return request(app).post(`/api/v1/orgs/${team.orgId}/rosters/${roster._id}/publish`).set(auth(team.tokens.owner));
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

describe('fairness API', () => {
  it('is empty, with no window, before anything is published', async () => {
    const res = await fairness(team.tokens.owner);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ view: 'team', window: null, computedAt: null, rows: [] });
  });

  it('recomputes when a roster is published', async () => {
    expect((await publishedWeek()).status).toBe(200);
    const res = await fairness(team.tokens.owner);

    expect(res.body.window).toEqual({ startDate: '2026-03-02', endDate: '2026-03-08', days: 7 });
    const nadia = res.body.rows.find((row) => row.membershipId === team.ids.nadia);
    expect(nadia).toMatchObject({ name: team.names.nadia, shiftsWorked: 5, shiftCounts: { night: 5 } });
    expect(nadia.deviationPercent).toBeGreaterThan(0);
  });

  it('gives managers every member, with names', async () => {
    await publishedWeek();
    const res = await fairness(team.tokens.owner);

    expect(res.body.rows.map((row) => row.name).sort()).toEqual(Object.values(team.names).sort());
  });

  it('gives a worker only their own figures, the average and the window', async () => {
    await publishedWeek();
    const res = await fairness(team.tokens.nadia);

    expect(res.body.view).toBe('self');
    expect(res.body.you).toMatchObject({ shiftsWorked: 5, shiftCounts: { night: 5 } });
    expect(res.body.teamAverage.normalisedBurden).toBeGreaterThan(0);
    expect(res.body).not.toHaveProperty('rows');

    // The raw JSON, not the parsed object: nothing about anyone else, anywhere.
    for (const other of ['owner', 'desmond']) {
      expect(res.text).not.toContain(team.ids[other]);
      expect(res.text).not.toContain(team.names[other]);
    }
    expect(res.text).not.toContain('membershipId');
  });

  it('refuses a recompute from a worker', async () => {
    expect((await recompute(team.tokens.nadia)).status).toBe(403);
  });

  it('lets a manager recompute, and returns the full ledger', async () => {
    await publishedWeek();
    const res = await recompute(team.tokens.owner);

    expect(res.status).toBe(200);
    expect(res.body.view).toBe('team');
    expect(res.body.rows).toHaveLength(3);
  });

  it('does not count a draft roster', async () => {
    await publishedWeek();
    const draft = await makeRoster(team, { startDate: '2026-03-09', endDate: '2026-03-15' });
    await addShifts(team, draft, team.ids.desmond, 'night', ['2026-03-09', '2026-03-10']);
    const res = await recompute(team.tokens.owner);

    const desmond = res.body.rows.find((row) => row.membershipId === team.ids.desmond);
    expect(desmond).toMatchObject({ shiftsWorked: 5, shiftCounts: { day: 5, night: 0 } });
    expect(res.body.window.endDate).toBe('2026-03-08');
  });
});
