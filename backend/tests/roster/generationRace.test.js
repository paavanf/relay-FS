// generationRace.test.js
// Two Generate requests for one organisation at the same moment: exactly one
// starts a run (202) and the other is refused (409, "already running"), and
// only one job is created - however the two interleave. Several rounds, each
// waiting for its run to end and give the organisation back.

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { Roster, GenerationJob, Organisation } from '../../src/models/index.js';
import { useConfigWorld, auth } from '../config/configWorld.js';

const ROUNDS = 4;
const world = useConfigWorld({ timezone: 'Europe/London' });

// Waits until no run is going and the organisation's claim is released.
async function runEnded(orgId) {
  for (let i = 0; i < 150; i += 1) {
    const active = await GenerationJob.countDocuments({ orgId, status: { $in: ['queued', 'running'] } });
    const org = await Organisation.findById(orgId).lean();
    if (active === 0 && !org.generationStartedAt) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

describe('two Generate requests at the same time', () => {
  it('start exactly one run: one 202, one 409, one job', async () => {
    const { app, ownerToken, orgId } = world;
    for (let round = 1; round <= ROUNDS; round += 1) {
      const roster = await Roster.create({ orgId, name: `Round ${round}`, startDate: '2026-03-02', endDate: '2026-03-08', status: 'draft' });
      const generate = () =>
        request(app).post(`/api/v1/orgs/${orgId}/rosters/${roster._id}/generate`).set(auth(ownerToken)).send({});

      const results = await Promise.all([generate(), generate()]);

      expect(results.map((res) => res.status).sort()).toEqual([202, 409]);
      expect(results.find((res) => res.status === 409).body.error.message).toMatch(/already running/i);
      expect(await GenerationJob.countDocuments({ orgId, rosterId: roster._id })).toBe(1);
      expect(await runEnded(orgId)).toBe(true);
    }
  }, 60_000);
});
