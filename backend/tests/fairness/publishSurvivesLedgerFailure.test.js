// publishSurvivesLedgerFailure.test.js
// A fairness recompute that fails must never fail the publish that triggered
// it. The publish is what people plan around; a stale ledger is only a number
// the next recompute puts right.
//
// The recompute service is replaced with one that always throws, so this file
// proves the publish path catches it - and that the failure is logged, not
// silently lost.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Roster } from '../../src/models/index.js';
import { logger } from '../../src/utils/logger.js';
import { auth, buildTeam, makeRoster, addShifts } from './team.js';

vi.mock('../../src/services/fairness/recomputeLedger.service.js', () => ({
  recomputeLedger: vi.fn(async () => {
    throw new Error('ledger store unavailable');
  }),
}));

let app;
let team;

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

describe('publishing while the ledger is broken', () => {
  it('still publishes, and logs the failed recompute', async () => {
    const logged = vi.spyOn(logger, 'error');
    const roster = await makeRoster(team, { startDate: '2026-03-02', endDate: '2026-03-08' });
    await addShifts(team, roster, team.ids.nadia, 'night', ['2026-03-02']);

    const res = await request(app)
      .post(`/api/v1/orgs/${team.orgId}/rosters/${roster._id}/publish`)
      .set(auth(team.tokens.owner));

    expect(res.status).toBe(200);
    expect((await Roster.findById(roster._id).lean()).status).toBe('published');
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: String(team.orgId) }),
      expect.stringContaining('recompute failed'),
    );
  });
});
