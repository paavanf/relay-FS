// generation.test.js
// The job API around generation. The refusals matter more than the happy
// path here: a published roster is what people have arranged childcare
// around, and a job stuck in `running` blocks the organisation forever.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Roster, GenerationJob, Membership } from '../../src/models/index.js';

let app;
let ownerToken;
let memberToken;
let orgId;

const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function signUp(email) {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Person', email, password: 'password123' });

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'password123' });

  return res.body.accessToken;
}

async function makeRoster(status = 'draft') {
  const roster = await Roster.create({
    orgId,
    name: 'March',
    startDate: '2026-03-02',
    endDate: '2026-03-08',
    status,
  });
  return String(roster._id);
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

  ownerToken = await signUp('owner@example.com');
  const org = await request(app)
    .post('/api/v1/orgs')
    .set(auth(ownerToken))
    .send({ name: 'Ward A', timezone: 'Europe/London' });
  orgId = org.body.id;

  // An ordinary member, invited and accepted, to check authorisation.
  memberToken = await signUp('nurse@example.com');
  const invite = await request(app)
    .post(`/api/v1/orgs/${orgId}/invites`)
    .set(auth(ownerToken))
    .send({ email: 'nurse@example.com', role: 'member' });
  const token = invite.body.inviteLink.split('/invite/')[1];
  await request(app).post(`/api/v1/orgs/invites/${token}/accept`).set(auth(memberToken));
});

describe('POST /orgs/:orgId/rosters/:rosterId/generate', () => {
  it('accepts a manager and answers 202 with a job id', async () => {
    const rosterId = await makeRoster();

    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/rosters/${rosterId}/generate`)
      .set(auth(ownerToken))
      .send({ seed: 1 });

    expect(res.status).toBe(202);
    expect(res.body.jobId).toBeTruthy();
    expect(res.body.status).toBe('queued');
  });

  it('refuses an ordinary member', async () => {
    const rosterId = await makeRoster();

    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/rosters/${rosterId}/generate`)
      .set(auth(memberToken))
      .send({});

    expect(res.status).toBe(403);
  });

  it('refuses to regenerate a published roster', async () => {
    const rosterId = await makeRoster('published');

    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/rosters/${rosterId}/generate`)
      .set(auth(ownerToken))
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/published/i);
  });

  it('refuses a second run while one is already going', async () => {
    const rosterId = await makeRoster();
    await GenerationJob.create({ orgId, rosterId, status: 'running' });

    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/rosters/${rosterId}/generate`)
      .set(auth(ownerToken))
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/already running/i);
  });

  it('404s for a roster belonging to another organisation', async () => {
    const otherToken = await signUp('other@example.com');
    const otherOrg = await request(app)
      .post('/api/v1/orgs')
      .set(auth(otherToken))
      .send({ name: 'Ward B', timezone: 'UTC' });

    const foreign = await Roster.create({
      orgId: otherOrg.body.id,
      name: 'Theirs',
      startDate: '2026-03-02',
      endDate: '2026-03-08',
    });

    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/rosters/${String(foreign._id)}/generate`)
      .set(auth(ownerToken))
      .send({});

    expect(res.status).toBe(404);
  });

  it('rejects a malformed roster id before touching anything', async () => {
    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/rosters/not-an-id/generate`)
      .set(auth(ownerToken))
      .send({});

    expect(res.status).toBe(422);
  });
});

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
