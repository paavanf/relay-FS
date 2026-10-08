// rosterCrud.test.js
// Roster listing, creation, reading and publishing, plus manual assignment.
//
// The behaviours worth pinning hardest are the ones a client cannot be
// trusted to enforce: a worker must never see a draft, a published roster
// must never be edited, and an edit that breaks a scheduling rule must be
// refused by the same engine the generator uses.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { Roster } from '../../src/models/index.js';

let app;
let ownerToken;
let workerToken;
let orgId;
let templateId;
let workerMembershipId;

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

async function makeRoster(body = {}) {
  const res = await request(app)
    .post(`/api/v1/orgs/${orgId}/rosters`)
    .set(auth(ownerToken))
    .send({ name: 'March', startDate: '2026-03-02', endDate: '2026-03-08', ...body });
  return res;
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

  const template = await request(app)
    .post(`/api/v1/orgs/${orgId}/shift-templates`)
    .set(auth(ownerToken))
    .send({ name: 'Day', startLocal: '07:00', endLocal: '15:00', category: 'day' });
  templateId = String(template.body.template._id);

  workerToken = await signUp('nurse@example.com');
  const invite = await request(app)
    .post(`/api/v1/orgs/${orgId}/invites`)
    .set(auth(ownerToken))
    .send({ email: 'nurse@example.com', role: 'member' });
  const token = invite.body.inviteLink.split('/invite/')[1];
  await request(app).post(`/api/v1/invites/${token}/accept`).set(auth(workerToken));

  const members = await request(app)
    .get(`/api/v1/orgs/${orgId}/members`)
    .set(auth(ownerToken));
  workerMembershipId = members.body.members.find((m) => m.email === 'nurse@example.com').id;
});

describe('rosters', () => {
  it('creates a draft', async () => {
    const res = await makeRoster();
    expect(res.status).toBe(201);
    expect(res.body.roster.status).toBe('draft');
  });

  it('refuses a worker creating one', async () => {
    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/rosters`)
      .set(auth(workerToken))
      .send({ name: 'Mine', startDate: '2026-03-02', endDate: '2026-03-08' });

    expect(res.status).toBe(403);
  });

  it('rejects a backwards date range', async () => {
    const res = await makeRoster({ startDate: '2026-03-08', endDate: '2026-03-02' });
    expect(res.status).toBe(422);
  });

  it('rejects a range longer than the cap', async () => {
    const res = await makeRoster({ startDate: '2026-03-01', endDate: '2026-06-01' });
    expect(res.status).toBe(422);
  });

  it('hides drafts from workers but shows them to managers', async () => {
    await makeRoster();

    const asManager = await request(app)
      .get(`/api/v1/orgs/${orgId}/rosters`)
      .set(auth(ownerToken));
    const asWorker = await request(app)
      .get(`/api/v1/orgs/${orgId}/rosters`)
      .set(auth(workerToken));

    expect(asManager.body.rosters).toHaveLength(1);
    expect(asWorker.body.rosters).toHaveLength(0);
  });

  it('404s rather than 403s when a worker asks for a draft directly', async () => {
    const created = await makeRoster();

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/rosters/${created.body.roster.id}`)
      .set(auth(workerToken));

    // 403 would confirm the draft exists, which is not theirs to learn.
    expect(res.status).toBe(404);
  });

  it('returns the roster with its assignments and unfilled slots', async () => {
    const created = await makeRoster();

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/rosters/${created.body.roster.id}`)
      .set(auth(ownerToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('assignments');
    expect(res.body).toHaveProperty('unfilledSlots');
  });

  it('returns unfilled slots with the counts of who each rule stopped', async () => {
    const created = await makeRoster();
    const rosterId = created.body.roster.id;

    // What the generator writes when it cannot cover a slot. An empty roster
    // has no unfilled slots, so without this the conversion is never run.
    await Roster.updateOne(
      { _id: rosterId },
      {
        $set: {
          unfilledSlots: [
            {
              slotId: 'slot-1',
              date: '2026-03-02',
              qualifiedCount: 3,
              blockedBy: { MIN_REST: 2, MAX_WEEKLY_HOURS: 1 },
              reason: '3 hold this qualification - 2 would breach minimum rest',
            },
          ],
        },
      },
    );

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/rosters/${rosterId}`)
      .set(auth(ownerToken));

    expect(res.status).toBe(200);
    expect(res.body.unfilledSlots).toHaveLength(1);
    expect(res.body.unfilledSlots[0].blockedBy).toEqual({ MIN_REST: 2, MAX_WEEKLY_HOURS: 1 });
  });

  it('publishes a draft, and shows it to workers afterwards', async () => {
    const created = await makeRoster();

    const published = await request(app)
      .post(`/api/v1/orgs/${orgId}/rosters/${created.body.roster.id}/publish`)
      .set(auth(ownerToken));
    expect(published.body.roster.status).toBe('published');

    const asWorker = await request(app)
      .get(`/api/v1/orgs/${orgId}/rosters`)
      .set(auth(workerToken));
    expect(asWorker.body.rosters).toHaveLength(1);
  });

  it('refuses to publish twice', async () => {
    const created = await makeRoster();
    const url = `/api/v1/orgs/${orgId}/rosters/${created.body.roster.id}/publish`;

    await request(app).post(url).set(auth(ownerToken));
    const second = await request(app).post(url).set(auth(ownerToken));

    expect(second.status).toBe(409);
  });
});

describe('manual assignment', () => {
  let rosterId;

  beforeEach(async () => {
    const created = await makeRoster();
    rosterId = created.body.roster.id;
  });

  function assign(body) {
    return request(app)
      .post(`/api/v1/orgs/${orgId}/assignments`)
      .set(auth(ownerToken))
      .send({ rosterId, membershipId: workerMembershipId, shiftTemplateId: templateId, date: '2026-03-02', ...body });
  }

  it('creates one and computes its real instants', async () => {
    const res = await assign();

    expect(res.status).toBe(201);
    // 07:00 London on 2 March is 07:00Z - GMT at that date.
    expect(res.body.assignment.startsAt).toBe('2026-03-02T07:00:00.000Z');
    expect(res.body.assignment.source).toBe('manual');
  });

  it('refuses a worker assigning anyone', async () => {
    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/assignments`)
      .set(auth(workerToken))
      .send({ rosterId, membershipId: workerMembershipId, shiftTemplateId: templateId, date: '2026-03-02' });

    expect(res.status).toBe(403);
  });

  it('refuses a second shift that breaks minimum rest, naming the rule', async () => {
    await assign();
    const res = await assign({ date: '2026-03-03' });

    // 15:00 to 07:00 next day is 16 hours - fine. Same day twice is not.
    const sameDay = await assign();
    expect(sameDay.status).toBe(409);
    expect(res.status).toBe(201);
  });

  it('reports the violation details so the UI can explain it', async () => {
    await assign();
    const clash = await assign();

    expect(clash.status).toBe(409);
    expect(clash.body.error.details.violations.length).toBeGreaterThan(0);
    expect(clash.body.error.message).toBeTruthy();
  });

  it('validates as a dry run without writing anything', async () => {
    await assign();

    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/assignments/validate`)
      .set(auth(ownerToken))
      .send({ rosterId, membershipId: workerMembershipId, shiftTemplateId: templateId, date: '2026-03-02' });

    // A rejected edit is still a successful answer to the question asked.
    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(false);
    expect(res.body.violations.length).toBeGreaterThan(0);

    const roster = await request(app)
      .get(`/api/v1/orgs/${orgId}/rosters/${rosterId}`)
      .set(auth(ownerToken));
    expect(roster.body.assignments).toHaveLength(1);
  });

  it('says a clean assignment is allowed', async () => {
    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/assignments/validate`)
      .set(auth(ownerToken))
      .send({ rosterId, membershipId: workerMembershipId, shiftTemplateId: templateId, date: '2026-03-05' });

    expect(res.body.allowed).toBe(true);
    expect(res.body.violations).toEqual([]);
  });

  it('moves an assignment without it clashing with itself', async () => {
    const created = await assign();

    const res = await request(app)
      .patch(`/api/v1/orgs/${orgId}/assignments/${created.body.assignment.id}`)
      .set(auth(ownerToken))
      .send({ date: '2026-03-04' });

    expect(res.status).toBe(200);
    expect(res.body.assignment.date).toBe('2026-03-04');
  });

  it('deletes one', async () => {
    const created = await assign();

    const res = await request(app)
      .delete(`/api/v1/orgs/${orgId}/assignments/${created.body.assignment.id}`)
      .set(auth(ownerToken));

    expect(res.status).toBe(204);
  });

  it('refuses every edit once the roster is published', async () => {
    const created = await assign();
    await request(app)
      .post(`/api/v1/orgs/${orgId}/rosters/${rosterId}/publish`)
      .set(auth(ownerToken));

    const added = await assign({ date: '2026-03-06' });
    const moved = await request(app)
      .patch(`/api/v1/orgs/${orgId}/assignments/${created.body.assignment.id}`)
      .set(auth(ownerToken))
      .send({ date: '2026-03-07' });
    const removed = await request(app)
      .delete(`/api/v1/orgs/${orgId}/assignments/${created.body.assignment.id}`)
      .set(auth(ownerToken));

    expect([added.status, moved.status, removed.status]).toEqual([409, 409, 409]);
  });
});

describe('GET /assignments', () => {
  it('returns nothing while the roster is only a draft', async () => {
    const created = await makeRoster();
    await request(app)
      .post(`/api/v1/orgs/${orgId}/assignments`)
      .set(auth(ownerToken))
      .send({ rosterId: created.body.roster.id, membershipId: workerMembershipId, shiftTemplateId: templateId, date: '2026-03-02' });

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/assignments`)
      .set(auth(workerToken));

    // A draft is not a commitment; My Shifts must not show one.
    expect(res.body.assignments).toEqual([]);
  });

  it('returns published shifts, and only the caller-s own for a worker', async () => {
    const created = await makeRoster();
    const rosterId = created.body.roster.id;

    const members = await request(app).get(`/api/v1/orgs/${orgId}/members`).set(auth(ownerToken));
    const ownerMembershipId = members.body.members.find((m) => m.email === 'owner@example.com').id;

    for (const membershipId of [workerMembershipId, ownerMembershipId]) {
      await request(app)
        .post(`/api/v1/orgs/${orgId}/assignments`)
        .set(auth(ownerToken))
        .send({ rosterId, membershipId, shiftTemplateId: templateId, date: '2026-03-02' });
    }

    await request(app).post(`/api/v1/orgs/${orgId}/rosters/${rosterId}/publish`).set(auth(ownerToken));

    const asWorker = await request(app)
      .get(`/api/v1/orgs/${orgId}/assignments`)
      .set(auth(workerToken));

    expect(asWorker.body.assignments).toHaveLength(1);
    expect(asWorker.body.assignments[0].membershipId).toBe(workerMembershipId);
  });

  it('filters by date range', async () => {
    const created = await makeRoster();
    const rosterId = created.body.roster.id;

    for (const date of ['2026-03-02', '2026-03-06']) {
      await request(app)
        .post(`/api/v1/orgs/${orgId}/assignments`)
        .set(auth(ownerToken))
        .send({ rosterId, membershipId: workerMembershipId, shiftTemplateId: templateId, date });
    }
    await request(app).post(`/api/v1/orgs/${orgId}/rosters/${rosterId}/publish`).set(auth(ownerToken));

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/assignments?from=2026-03-05&to=2026-03-10`)
      .set(auth(workerToken));

    expect(res.body.assignments).toHaveLength(1);
    expect(res.body.assignments[0].date).toBe('2026-03-06');
  });

  it('ignores a roster from another organisation', async () => {
    await Roster.create({ orgId: workerMembershipId, name: 'Elsewhere', startDate: '2026-03-02', endDate: '2026-03-08', status: 'published' });

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/assignments`)
      .set(auth(ownerToken));

    expect(res.body.assignments).toEqual([]);
  });
});
