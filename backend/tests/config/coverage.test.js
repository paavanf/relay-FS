// coverage.test.js
// Coverage requirements (Milestone 2): one rule per shift and weekday, replaced
// rather than duplicated; another organisation's shift template is refused;
// members cannot write coverage.
//
// The middleware chain on nested routers matters most here: :orgId has to
// survive the mount path (mergeParams), and members read configuration without
// being able to change it. The world - an owner and one member - is configWorld.js.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { useConfigWorld, auth, signUp as signUpAs, makeQualification as qualificationIn, makeTemplate as templateIn } from './configWorld.js';

const world = useConfigWorld();
let app;
let ownerToken;
let memberToken;
let orgId;
beforeEach(() => ({ app, ownerToken, memberToken, orgId } = world));

const signUp = (email) => signUpAs(world.app, email);
const makeQualification = (code) => qualificationIn(world, code);
const makeTemplate = (name) => templateIn(world, name);

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
