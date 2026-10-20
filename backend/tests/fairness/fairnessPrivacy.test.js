// fairnessPrivacy.test.js
// What a worker gets from the fairness API - only their own figures and the
// window - and POST /fairness/recompute, which is for managers alone and
// returns the full ledger.
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
  it('gives a worker only their own figures and the window', async () => {
    await publishedWeek();
    const res = await fairness(team.tokens.nadia);

    expect(res.body.view).toBe('self');
    expect(res.body.you).toMatchObject({ shiftsWorked: 5, shiftCounts: { night: 5 } });
    expect(res.body.window).toMatchObject({ startDate: '2026-03-02', endDate: '2026-03-08' });
    expect(res.body).not.toHaveProperty('rows');
    // Only two people are measured here, so the average is withheld too -
    // smallTeamPrivacy.test.js covers that rule on its own.

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
});
