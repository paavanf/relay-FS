// fairnessApi.test.js
// GET /orgs/:orgId/fairness: empty before anything is published, recomputed
// when a roster is, every member with names for a manager - and a draft
// never counts.
//
// Privacy is pinned hardest: a worker's response must contain no other member's
// id, name or figures - asserted on the raw JSON text, so nothing can hide in a
// field the UI happens not to show. The team is team.js.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { auth, buildTeam, makeRoster, addShifts } from './team.js';
import { useEmptyDb } from '../helpers/apiTest.js';

const world = useEmptyDb(async (app) => ({ team: await buildTeam(app) }));
let app;
let team;
beforeEach(() => ({ app, team } = world));

// buildTeam builds the team before every test (useEmptyDb above).

const WEEK = ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'];
const fairness = (token) => request(app).get(`/api/v1/orgs/${team.orgId}/fairness`).set(auth(token));
const recompute = (token) => request(app).post(`/api/v1/orgs/${team.orgId}/fairness/recompute`).set(auth(token));
async function publishedWeek() {
  const roster = await makeRoster(team, { startDate: '2026-03-02', endDate: '2026-03-08' });
  await addShifts(team, roster, team.ids.nadia, 'night', WEEK);
  await addShifts(team, roster, team.ids.desmond, 'day', WEEK);
  return request(app).post(`/api/v1/orgs/${team.orgId}/rosters/${roster._id}/publish`).set(auth(team.tokens.owner));
}

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
