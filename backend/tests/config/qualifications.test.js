// qualifications.test.js
// Qualifications (Milestone 2): codes stored in capitals and unique within an
// organisation, read by members, changed by managers, and nobody else's.
//
// The middleware chain on nested routers matters most here: :orgId has to
// survive the mount path (mergeParams), and members read configuration without
// being able to change it. The world - an owner and one member - is configWorld.js.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { useConfigWorld, auth, signUp as signUpAs, makeQualification as qualificationIn } from './configWorld.js';

const world = useConfigWorld();
let app;
let ownerToken;
let memberToken;
let orgId;
beforeEach(() => ({ app, ownerToken, memberToken, orgId } = world));

const signUp = (email) => signUpAs(world.app, email);
const makeQualification = (code) => qualificationIn(world, code);

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
