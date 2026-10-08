// team.js
// A real team for the fairness API tests, built through the API: an owner and
// two nurses with distinct names, so a test can search a raw response for the
// people it must NOT contain. Shifts are written straight to the database -
// how a roster gets its shifts is tested elsewhere; here only publishing and
// the ledger matter.

import request from 'supertest';
import { Assignment, Roster } from '../../src/models/index.js';

export const auth = (token) => ({ Authorization: `Bearer ${token}` });

const TIMES = { day: ['07:00', '15:00'], night: ['23:00', '07:00'] };

async function signUp(app, name, email) {
  await request(app).post('/api/v1/auth/register').send({ name, email, password: 'password123' });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'password123' });
  return res.body.accessToken;
}

async function join(app, { orgId, ownerToken, name, email }) {
  const token = await signUp(app, name, email);
  const invite = await request(app)
    .post(`/api/v1/orgs/${orgId}/invites`)
    .set(auth(ownerToken))
    .send({ email, role: 'member' });
  await request(app)
    .post(`/api/v1/orgs/invites/${invite.body.inviteLink.split('/invite/')[1]}/accept`)
    .set(auth(token));
  return token;
}

export async function buildTeam(app) {
  const ownerToken = await signUp(app, 'Olive Owner', 'owner@example.com');
  const org = await request(app)
    .post('/api/v1/orgs')
    .set(auth(ownerToken))
    .send({ name: 'Ward A', timezone: 'Europe/London' });
  const orgId = org.body.id;

  const templateIds = {};
  for (const [kind, category, burdenWeight] of [['day', 'day', 1], ['night', 'night', 1.8]]) {
    const [startLocal, endLocal] = TIMES[kind];
    const res = await request(app)
      .post(`/api/v1/orgs/${orgId}/shift-templates`)
      .set(auth(ownerToken))
      .send({ name: kind, startLocal, endLocal, category, burdenWeight });
    templateIds[kind] = String(res.body.template._id);
  }

  const nightToken = await join(app, { orgId, ownerToken, name: 'Nadia Nightingale', email: 'nadia@example.com' });
  const dayToken = await join(app, { orgId, ownerToken, name: 'Desmond Dayton', email: 'desmond@example.com' });

  const members = await request(app).get(`/api/v1/orgs/${orgId}/members`).set(auth(ownerToken));
  const idOf = (email) => members.body.members.find((m) => m.email === email).id;

  return {
    orgId,
    templateIds,
    tokens: { owner: ownerToken, nadia: nightToken, desmond: dayToken },
    ids: { owner: idOf('owner@example.com'), nadia: idOf('nadia@example.com'), desmond: idOf('desmond@example.com') },
    names: { owner: 'Olive Owner', nadia: 'Nadia Nightingale', desmond: 'Desmond Dayton' },
  };
}

/** A roster with the given status, directly in the database. */
export function makeRoster(team, { startDate, endDate, status = 'draft' }) {
  return Roster.create({
    orgId: team.orgId,
    name: `${startDate} roster`,
    startDate,
    endDate,
    status,
    createdBy: team.ids.owner,
  });
}

/** Shifts of one kind for one member on the given London dates (GMT in early March). */
export function addShifts(team, roster, membershipId, kind, dates) {
  const [start, end] = TIMES[kind];
  return Assignment.insertMany(
    dates.map((date) => {
      const startsAt = new Date(`${date}T${start}:00Z`);
      const endsAt = new Date(`${date}T${end}:00Z`);
      if (endsAt <= startsAt) endsAt.setUTCDate(endsAt.getUTCDate() + 1);
      return { orgId: team.orgId, rosterId: roster._id, membershipId, shiftTemplateId: team.templateIds[kind], date, startsAt, endsAt };
    }),
  );
}
