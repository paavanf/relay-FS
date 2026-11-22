// generationRefusals.test.js
// The generations that are refused before anything runs: a second while one
// is going, another organisation's roster (404), and a malformed id.
//
// The refusals matter more than the happy path: a published roster is what
// people have arranged childcare around, and two runs at once would write
// over each other. (Two requests at the very same moment are
// generationRace.test.js; a run left going by a stopped server,
// abandonedRuns.test.js.) The world - an owner and one member - is
// ../config/configWorld.js.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Roster } from '../../src/models/index.js';
import { claimGeneration } from '../../src/services/roster/generationClaim.js';
import { useConfigWorld, auth, signUp as signUpAs } from '../config/configWorld.js';

const world = useConfigWorld({ timezone: 'Europe/London' });
let app;
let ownerToken;
let orgId;
beforeEach(() => ({ app, ownerToken, orgId } = world));

const signUp = (email) => signUpAs(world.app, email);
const makeRoster = async (status = 'draft') =>
  String((await Roster.create({ orgId: world.orgId, name: 'March', startDate: '2026-03-02', endDate: '2026-03-08', status }))._id);

describe('POST /orgs/:orgId/rosters/:rosterId/generate', () => {
  it('refuses a second run while one is already going', async () => {
    const rosterId = await makeRoster();
    // A run is going: it holds the organisation's claim.
    await claimGeneration(orgId, new Date());

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
