// shiftTemplates.test.js
// Shift templates (Milestone 2): whether a shift crosses midnight is worked
// out from its times, retiring keeps a template for the rosters that use it,
// and a malformed time is refused.
//
// The middleware chain on nested routers matters most here: :orgId has to
// survive the mount path (mergeParams), and members read configuration without
// being able to change it. The world - an owner and one member - is configWorld.js.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { useConfigWorld, auth, makeTemplate as templateIn } from './configWorld.js';

const world = useConfigWorld();
let app;
let ownerToken;
let orgId;
beforeEach(() => ({ app, ownerToken, orgId } = world));

const makeTemplate = (name) => templateIn(world, name);

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
