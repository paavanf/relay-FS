// abandonedRuns.test.js
// A run whose server stopped part-way must not block anything for good.
// Once past the run deadline (GENERATION_DEADLINE_MS), the organisation's
// claim is taken over by a new run, and the job left `running` is reported
// failed - when its page asks, and at start-up. Before the deadline both are
// left alone, because another server could still be working on them.

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { Roster, GenerationJob, Organisation } from '../../src/models/index.js';
import { GENERATION_DEADLINE_MS } from '../../src/config/constants.js';
import { failAbandonedJobs, ABANDONED } from '../../src/services/roster/abandonedJobs.js';
import { useConfigWorld, auth } from '../config/configWorld.js';

const world = useConfigWorld({ timezone: 'Europe/London' });
const pastTheDeadline = () => new Date(Date.now() - GENERATION_DEADLINE_MS - 60_000);
const makeRoster = (orgId) => Roster.create({ orgId, name: 'March', startDate: '2026-03-02', endDate: '2026-03-08', status: 'draft' });

// A job as a stopped server leaves it: still `running`, and created `at`.
async function leftRunning(orgId, rosterId, at) {
  const job = await GenerationJob.create({ orgId, rosterId, status: 'running' });
  await GenerationJob.collection.updateOne({ _id: job._id }, { $set: { createdAt: at } });
  return String(job._id);
}

describe('a run whose server stopped', () => {
  it('no longer blocks the organisation once past the deadline', async () => {
    const { app, ownerToken, orgId } = world;
    const roster = await makeRoster(orgId);
    await Organisation.updateOne({ _id: orgId }, { $set: { generationStartedAt: pastTheDeadline() } });

    const res = await request(app).post(`/api/v1/orgs/${orgId}/rosters/${roster._id}/generate`).set(auth(ownerToken)).send({});
    expect(res.status).toBe(202);
  });

  it('is reported failed when its page asks, once past the deadline - a recent one is left alone', async () => {
    const { app, ownerToken, orgId } = world;
    const roster = await makeRoster(orgId);
    const abandoned = await leftRunning(orgId, roster._id, pastTheDeadline());
    const recent = await leftRunning(orgId, roster._id, new Date());
    const ask = (jobId) => request(app).get(`/api/v1/orgs/${orgId}/jobs/${jobId}`).set(auth(ownerToken));

    expect((await ask(abandoned)).body).toMatchObject({ status: 'failed', error: ABANDONED });
    expect((await ask(recent)).body).toMatchObject({ status: 'running', error: null });
  });

  it('is recorded failed at start-up only once past the deadline', async () => {
    const { orgId } = world;
    const roster = await makeRoster(orgId);
    const abandoned = await leftRunning(orgId, roster._id, pastTheDeadline());
    const recent = await leftRunning(orgId, roster._id, new Date());

    expect(await failAbandonedJobs()).toBe(1);
    expect((await GenerationJob.findById(abandoned).lean()).status).toBe('failed');
    expect((await GenerationJob.findById(recent).lean()).status).toBe('running');
  });
});
