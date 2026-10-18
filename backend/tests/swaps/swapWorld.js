// swapWorld.js
// A small organisation for the swap API tests: an owner, a manager and two
// workers (Wren and Sam), a day shift template, and two rosters - one
// published, one draft - in the weeks ahead.
//
// Dates are counted from today, so a "future" shift stays in the future
// however long after this was written the suite runs.

import request from 'supertest';
import { Roster, Assignment } from '../../src/models/index.js';
import { auth, buildOrg, join } from '../helpers/orgBuilder.js';

const DAY_MS = 86_400_000;

/** The calendar date `days` from today, YYYY-MM-DD. Negative is the past. */
export const dateFromToday = (days) => new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);

export async function swapWorld(app) {
  const org = await buildOrg(app);
  const sam = await join(app, { orgId: org.orgId, ownerToken: org.owner.token, name: 'Sam Second', email: 'sam@example.com' });

  const template = await request(app)
    .post(`/api/v1/orgs/${org.orgId}/shift-templates`)
    .set(auth(org.owner.token))
    .send({ name: 'Day', startLocal: '07:00', endLocal: '15:00', category: 'day' });
  const shiftTemplateId = template.body.template._id;

  const roster = (status) =>
    Roster.create({ orgId: org.orgId, name: status, startDate: dateFromToday(-7), endDate: dateFromToday(30), status });
  const published = await roster('published');
  const draft = await roster('draft');

  /** A day shift (07:00-15:00 UTC; no rule here depends on the local weekday) for someone on a roster, `days` from today. */
  const shift = async (onRoster, membershipId, days) => {
    const date = dateFromToday(days);
    const assignment = await Assignment.create({
      orgId: org.orgId,
      rosterId: onRoster._id,
      membershipId,
      shiftTemplateId,
      date,
      startsAt: new Date(`${date}T07:00:00Z`),
      endsAt: new Date(`${date}T15:00:00Z`),
    });
    return String(assignment._id);
  };

  return { ...org, sam, published, draft, shift };
}

/** POST /swap-requests as someone. */
export const offerShift = (app, orgId, token, assignmentId, note) =>
  request(app).post(`/api/v1/orgs/${orgId}/swap-requests`).set(auth(token)).send(note === undefined ? { assignmentId } : { assignmentId, note });
