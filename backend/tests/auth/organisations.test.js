// organisations.test.js
// Creating an organisation makes its creator the owner; members can list the
// team; a non-member is answered 404, not 403, so an organisation id cannot
// be probed.
//
// Multi-tenancy, as the original organisation tests pinned it.

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { auth, signUp as signUpAs } from '../helpers/orgBuilder.js';
import { useEmptyDb } from '../helpers/apiTest.js';

const world = useEmptyDb();
let app;
beforeEach(() => ({ app } = world));

const signUp = (email, name = 'Someone') => signUpAs(world.app, name, email);

describe('organisations', () => {
  it('creates an org and makes the creator its owner', async () => {
    const token = await signUp('owner@example.com', 'Owner');

    const created = await request(app)
      .post('/api/v1/orgs')
      .set(auth(token))
      .send({ name: 'Ward A', timezone: 'Asia/Kolkata' });

    expect(created.status).toBe(201);
    expect(created.body.name).toBe('Ward A');

    // The creator should now show up in /me with the owner role.
    const me = await request(app).get('/api/v1/auth/me').set(auth(token));
    expect(me.body.memberships).toHaveLength(1);
    expect(me.body.memberships[0].role).toBe('owner');
    expect(me.body.memberships[0].orgName).toBe('Ward A');
  });

  it('lists members of an org the caller belongs to', async () => {
    const token = await signUp('owner@example.com', 'Owner');
    const org = await request(app).post('/api/v1/orgs').set(auth(token)).send({ name: 'Ward A' });

    const res = await request(app)
      .get(`/api/v1/orgs/${org.body.id}/members`)
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.members).toHaveLength(1);
    expect(res.body.members[0].email).toBe('owner@example.com');
  });

  it('hides an org from a non-member with 404, not 403', async () => {
    const ownerToken = await signUp('owner@example.com', 'Owner');
    const org = await request(app)
      .post('/api/v1/orgs')
      .set(auth(ownerToken))
      .send({ name: 'Ward A' });

    const outsiderToken = await signUp('outsider@example.com', 'Outsider');

    const res = await request(app)
      .get(`/api/v1/orgs/${org.body.id}/members`)
      .set(auth(outsiderToken));

    // 404 rather than 403 - a 403 would confirm the org exists.
    expect(res.status).toBe(404);
  });
});
