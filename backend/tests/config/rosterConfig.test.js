// rosterConfig.test.js
// Milestone 2 endpoints: qualifications, shift templates, coverage, and
// availability.
//
// The thing most worth pinning here is the middleware chain on nested
// routers: :orgId has to survive the mount path (mergeParams) or every one of
// these routes 404s, and members must be able to read config without being
// able to change it.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';

let app;
let ownerToken;
let memberToken;
let orgId;
let memberMembershipId;

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

// An owner with an organisation, plus an ordinary member inside it.
async function seedOrgWithMember() {
  ownerToken = await signUp('owner@example.com');

  const org = await request(app)
    .post('/api/v1/orgs')
    .set(auth(ownerToken))
    .send({ name: 'Ward A' });
  orgId = org.body.id;

  const invite = await request(app)
    .post(`/api/v1/orgs/${orgId}/invites`)
    .set(auth(ownerToken))
    .send({ email: 'nurse@example.com', role: 'member' });

  const rawToken = invite.body.inviteLink.split('/invite/')[1];
  memberToken = await signUp('nurse@example.com');
  await request(app).post(`/api/v1/orgs/invites/${rawToken}/accept`).set(auth(memberToken));

  const members = await request(app)
    .get(`/api/v1/orgs/${orgId}/members`)
    .set(auth(ownerToken));
  memberMembershipId = members.body.members.find((m) => m.email === 'nurse@example.com').id;
}

async function makeQualification(code = 'RN') {
  const res = await request(app)
    .post(`/api/v1/orgs/${orgId}/qualifications`)
    .set(auth(ownerToken))
    .send({ name: 'Registered Nurse', code });
  return res.body.qualification;
}

async function makeTemplate(name = 'Night') {
  const res = await request(app)
    .post(`/api/v1/orgs/${orgId}/shift-templates`)
    .set(auth(ownerToken))
    .send({ name, startLocal: '23:00', endLocal: '07:00', category: 'night' });
  return res.body.template;
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
  await seedOrgWithMember();
});

describe('qualifications', () => {
  it('creates one, uppercasing the code', async () => {
    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/qualifications`)
      .set(auth(ownerToken))
      .send({ name: 'Registered Nurse', code: 'rn' });

    expect(res.status).toBe(201);
    expect(res.body.qualification.code).toBe('RN');
  });

  it('rejects a duplicate code in the same org, whatever its casing', async () => {
    await makeQualification('RN');

    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/qualifications`)
      .set(auth(ownerToken))
      .send({ name: 'Another', code: 'rn' });

    expect(res.status).toBe(409);
  });

  it('lets a member read but not create', async () => {
    await makeQualification();

    const read = await request(app)
      .get(`/api/v1/orgs/${orgId}/qualifications`)
      .set(auth(memberToken));
    expect(read.status).toBe(200);
    expect(read.body.qualifications).toHaveLength(1);

    const write = await request(app)
      .post(`/api/v1/orgs/${orgId}/qualifications`)
      .set(auth(memberToken))
      .send({ name: 'Healthcare Assistant', code: 'HCA' });
    expect(write.status).toBe(403);
  });

  it('updates and deletes, and 404s on an unknown id', async () => {
    const qual = await makeQualification();

    const updated = await request(app)
      .patch(`/api/v1/orgs/${orgId}/qualifications/${qual._id}`)
      .set(auth(ownerToken))
      .send({ name: 'Senior Registered Nurse' });
    expect(updated.body.qualification.name).toBe('Senior Registered Nurse');

    expect(
      (await request(app)
        .delete(`/api/v1/orgs/${orgId}/qualifications/${qual._id}`)
        .set(auth(ownerToken))).status,
    ).toBe(204);

    const missing = await request(app)
      .delete(`/api/v1/orgs/${orgId}/qualifications/${qual._id}`)
      .set(auth(ownerToken));
    expect(missing.status).toBe(404);
  });

  it('refuses a caller who is not a member of the org', async () => {
    const outsider = await signUp('outsider@example.com');

    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/qualifications`)
      .set(auth(outsider));

    // 404 rather than 403 - a 403 would confirm the org exists.
    expect(res.status).toBe(404);
  });
});

describe('shift templates', () => {
  it('works out crossesMidnight from the times', async () => {
    const night = await makeTemplate('Night');
    expect(night.crossesMidnight).toBe(true);

    const day = await request(app)
      .post(`/api/v1/orgs/${orgId}/shift-templates`)
      .set(auth(ownerToken))
      .send({ name: 'Day', startLocal: '07:00', endLocal: '15:00', category: 'day' });
    expect(day.body.template.crossesMidnight).toBe(false);
  });

  it('recomputes crossesMidnight when the times change', async () => {
    const template = await makeTemplate();

    const res = await request(app)
      .patch(`/api/v1/orgs/${orgId}/shift-templates/${template._id}`)
      .set(auth(ownerToken))
      .send({ startLocal: '09:00', endLocal: '17:00' });

    expect(res.body.template.crossesMidnight).toBe(false);
  });

  it('retires rather than destroys, so rosters can still resolve it', async () => {
    const template = await makeTemplate();

    expect(
      (await request(app)
        .delete(`/api/v1/orgs/${orgId}/shift-templates/${template._id}`)
        .set(auth(ownerToken))).status,
    ).toBe(204);

    const list = await request(app)
      .get(`/api/v1/orgs/${orgId}/shift-templates`)
      .set(auth(ownerToken));
    expect(list.body.templates).toHaveLength(0);
  });

  it('rejects a malformed time', async () => {
    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/shift-templates`)
      .set(auth(ownerToken))
      .send({ name: 'Bad', startLocal: '25:00', endLocal: '07:00', category: 'night' });

    expect(res.status).toBe(422);
  });
});

describe('coverage requirements', () => {
  it('creates a rule, then replaces it for the same shift and weekday', async () => {
    const qual = await makeQualification();
    const template = await makeTemplate();
    const url = `/api/v1/orgs/${orgId}/coverage`;

    const first = await request(app)
      .put(url)
      .set(auth(ownerToken))
      .send({
        shiftTemplateId: template._id,
        dayOfWeek: 0,
        requirements: [{ qualificationId: qual._id, count: 2 }],
      });
    expect(first.status).toBe(200);
    expect(first.body.coverage.requirements[0].count).toBe(2);

    const second = await request(app)
      .put(url)
      .set(auth(ownerToken))
      .send({
        shiftTemplateId: template._id,
        dayOfWeek: 0,
        requirements: [{ qualificationId: qual._id, count: 3 }],
      });
    expect(second.body.coverage.requirements[0].count).toBe(3);

    // Replaced, not duplicated.
    const list = await request(app).get(url).set(auth(ownerToken));
    expect(list.body.coverage).toHaveLength(1);
  });

  it('refuses a shift template from another organisation', async () => {
    const qual = await makeQualification();

    const otherOwner = await signUp('other@example.com');
    const otherOrg = await request(app)
      .post('/api/v1/orgs')
      .set(auth(otherOwner))
      .send({ name: 'Ward B' });
    const foreign = await request(app)
      .post(`/api/v1/orgs/${otherOrg.body.id}/shift-templates`)
      .set(auth(otherOwner))
      .send({ name: 'Night', startLocal: '23:00', endLocal: '07:00', category: 'night' });

    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/coverage`)
      .set(auth(ownerToken))
      .send({
        shiftTemplateId: foreign.body.template._id,
        dayOfWeek: 0,
        requirements: [{ qualificationId: qual._id, count: 1 }],
      });

    expect(res.status).toBe(404);
  });

  it('stops a member writing coverage', async () => {
    const qual = await makeQualification();
    const template = await makeTemplate();

    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/coverage`)
      .set(auth(memberToken))
      .send({
        shiftTemplateId: template._id,
        dayOfWeek: 1,
        requirements: [{ qualificationId: qual._id, count: 1 }],
      });

    expect(res.status).toBe(403);
  });
});

describe('availability', () => {
  const entries = [
    { type: 'recurring', dayOfWeek: 1, status: 'unavailable', note: 'Class' },
    { type: 'exception', date: '2026-12-24T00:00:00.000Z', status: 'avoid', note: '' },
  ];

  it('lets a member set and read their own', async () => {
    const set = await request(app)
      .put(`/api/v1/orgs/${orgId}/availability/me`)
      .set(auth(memberToken))
      .send({ entries });
    expect(set.status).toBe(200);
    expect(set.body.entries).toHaveLength(2);

    const read = await request(app)
      .get(`/api/v1/orgs/${orgId}/availability/me`)
      .set(auth(memberToken));
    expect(read.body.entries).toHaveLength(2);
  });

  it('replaces the whole set rather than appending', async () => {
    const url = `/api/v1/orgs/${orgId}/availability/me`;
    await request(app).put(url).set(auth(memberToken)).send({ entries });

    const replaced = await request(app)
      .put(url)
      .set(auth(memberToken))
      .send({ entries: [{ type: 'recurring', dayOfWeek: 5, status: 'prefer' }] });

    expect(replaced.body.entries).toHaveLength(1);
    expect(replaced.body.entries[0].dayOfWeek).toBe(5);
  });

  it('accepts an empty set, clearing everything', async () => {
    const url = `/api/v1/orgs/${orgId}/availability/me`;
    await request(app).put(url).set(auth(memberToken)).send({ entries });

    const cleared = await request(app).put(url).set(auth(memberToken)).send({ entries: [] });
    expect(cleared.body.entries).toHaveLength(0);
  });

  it('requires a weekday on a recurring entry', async () => {
    const res = await request(app)
      .put(`/api/v1/orgs/${orgId}/availability/me`)
      .set(auth(memberToken))
      .send({ entries: [{ type: 'recurring', status: 'unavailable' }] });

    expect(res.status).toBe(422);
  });

  it('lets a manager read and set a member’s availability', async () => {
    const url = `/api/v1/orgs/${orgId}/availability/${memberMembershipId}`;

    const set = await request(app).put(url).set(auth(ownerToken)).send({ entries });
    expect(set.status).toBe(200);

    const read = await request(app).get(url).set(auth(ownerToken));
    expect(read.body.entries).toHaveLength(2);
  });

  it('stops a member reaching someone else’s availability', async () => {
    const res = await request(app)
      .get(`/api/v1/orgs/${orgId}/availability/${memberMembershipId}`)
      .set(auth(memberToken));

    expect(res.status).toBe(403);
  });
});
