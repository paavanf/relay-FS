// generationJobs.test.js
// Reading a generation job: any member may, a failure says why rather than
// hiding it, and another organisation's job is a 404.
//
// The refusals matter more than the happy path: a published roster is what
// people have arranged childcare around, and a job stuck in `running` blocks
// the organisation forever. The world - an owner and one member - is
// ../config/configWorld.js.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Roster, GenerationJob, Membership } from '../../src/models/index.js';
import { useConfigWorld, auth } from '../config/configWorld.js';

const world = useConfigWorld({ timezone: 'Europe/London' });
let app;
let ownerToken;
let memberToken;
let orgId;
beforeEach(() => ({ app, ownerToken, memberToken, orgId } = world));

const makeRoster = async (status = 'draft') =>
  String((await Roster.create({ orgId: world.orgId, name: 'March', startDate: '2026-03-02', endDate: '2026-03-08', status }))._id);

describe('GET /orgs/:orgId/jobs/:jobId', () => {
  it('lets any member read a job', async () => {
    const rosterId = await makeRoster();
    const job = await GenerationJob.create({
      orgId,
      rosterId,
      status: 'completed',
      progress: 100,
      metrics: { iterations: 12, objectiveScore: 40, unfilledCount: 0, durationMs: 900 },
    });

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/jobs/${String(job._id)}`)
      .set(auth(memberToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
    expect(res.body.progress).toBe(100);
    expect(res.body.metrics.unfilledCount).toBe(0);
  });

  it('reports a failure with its reason rather than hiding it', async () => {
    const rosterId = await makeRoster();
    const job = await GenerationJob.create({
      orgId,
      rosterId,
      status: 'failed',
      error: 'Generation timed out and was stopped',
    });

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/jobs/${String(job._id)}`)
      .set(auth(ownerToken));

    expect(res.body.status).toBe('failed');
    expect(res.body.error).toMatch(/timed out/);
  });

  it('404s for a job in another organisation', async () => {
    const stranger = await GenerationJob.create({
      orgId: (await Membership.findOne({}))._id, // any other ObjectId
      rosterId: await makeRoster(),
      status: 'queued',
    });

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/jobs/${String(stranger._id)}`)
      .set(auth(ownerToken));

    expect(res.status).toBe(404);
  });
});
