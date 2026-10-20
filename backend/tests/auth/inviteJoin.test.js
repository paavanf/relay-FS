// inviteJoin.test.js
// The invite round trip: an owner invites someone and they join - and an
// invite addressed to a different email is refused.
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
  it('lets an owner invite someone, and that person join', async () => {
    const ownerToken = await signUp('owner@example.com', 'Owner');
    const org = await request(app)
      .post('/api/v1/orgs')
      .set(auth(ownerToken))
      .send({ name: 'Ward A' });

    const invited = await request(app)
      .post(`/api/v1/orgs/${org.body.id}/invites`)
      .set(auth(ownerToken))
      .send({ email: 'nurse@example.com', role: 'member' });

    expect(invited.status).toBe(201);
    expect(invited.body.inviteLink).toContain('/invite/');

    // Pull the raw token back out of the link the API returned.
    const rawToken = invited.body.inviteLink.split('/invite/')[1];

    const nurseToken = await signUp('nurse@example.com', 'Nurse');
    const accepted = await request(app)
      .post(`/api/v1/invites/${rawToken}/accept`)
      .set(auth(nurseToken));

    expect(accepted.status).toBe(201);
    expect(accepted.body.membership.role).toBe('member');

    const me = await request(app).get('/api/v1/auth/me').set(auth(nurseToken));
    expect(me.body.memberships[0].orgName).toBe('Ward A');
  });

  it('refuses an invite addressed to a different email', async () => {
    const ownerToken = await signUp('owner@example.com', 'Owner');
    const org = await request(app)
      .post('/api/v1/orgs')
      .set(auth(ownerToken))
      .send({ name: 'Ward A' });

    const invited = await request(app)
      .post(`/api/v1/orgs/${org.body.id}/invites`)
      .set(auth(ownerToken))
      .send({ email: 'intended@example.com', role: 'member' });

    const rawToken = invited.body.inviteLink.split('/invite/')[1];
    const wrongToken = await signUp('someone.else@example.com', 'Interloper');

    const res = await request(app)
      .post(`/api/v1/invites/${rawToken}/accept`)
      .set(auth(wrongToken));

    expect(res.status).toBe(403);
  });
});
