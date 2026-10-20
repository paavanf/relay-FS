// generationStart.test.js
// Starting a generation: a manager gets 202 and a job id; an ordinary member
// is refused, and so is regenerating a published roster.
//
// The refusals matter more than the happy path: a published roster is what
// people have arranged childcare around, and a job stuck in `running` blocks
// the organisation forever. The world - an owner and one member - is
// ../config/configWorld.js.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Roster } from '../../src/models/index.js';
import { useConfigWorld, auth } from '../config/configWorld.js';

const world = useConfigWorld({ timezone: 'Europe/London' });
let app;
let ownerToken;
let memberToken;
let orgId;
beforeEach(() => ({ app, ownerToken, memberToken, orgId } = world));

const makeRoster = async (status = 'draft') =>
  String((await Roster.create({ orgId: world.orgId, name: 'March', startDate: '2026-03-02', endDate: '2026-03-08', status }))._id);

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
});
