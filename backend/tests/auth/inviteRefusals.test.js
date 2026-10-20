// inviteRefusals.test.js
// Invites that are refused: a plain member cannot invite people, and an
// invite cannot be used twice.
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
  it('stops a plain member from inviting people', async () => {
    const ownerToken = await signUp('owner@example.com', 'Owner');
    const org = await request(app)
      .post('/api/v1/orgs')
      .set(auth(ownerToken))
      .send({ name: 'Ward A' });

    const invited = await request(app)
      .post(`/api/v1/orgs/${org.body.id}/invites`)
      .set(auth(ownerToken))
      .send({ email: 'nurse@example.com', role: 'member' });

    const rawToken = invited.body.inviteLink.split('/invite/')[1];
    const nurseToken = await signUp('nurse@example.com', 'Nurse');
    await request(app).post(`/api/v1/invites/${rawToken}/accept`).set(auth(nurseToken));

    // Now a member of the org, but only a 'member' - inviting is manager-only.
    const res = await request(app)
      .post(`/api/v1/orgs/${org.body.id}/invites`)
      .set(auth(nurseToken))
      .send({ email: 'another@example.com', role: 'member' });

    expect(res.status).toBe(403);
  });

  it('rejects a second use of the same invite', async () => {
    const ownerToken = await signUp('owner@example.com', 'Owner');
    const org = await request(app)
      .post('/api/v1/orgs')
      .set(auth(ownerToken))
      .send({ name: 'Ward A' });

    const invited = await request(app)
      .post(`/api/v1/orgs/${org.body.id}/invites`)
      .set(auth(ownerToken))
      .send({ email: 'nurse@example.com', role: 'member' });

    const rawToken = invited.body.inviteLink.split('/invite/')[1];
    const nurseToken = await signUp('nurse@example.com', 'Nurse');

    await request(app).post(`/api/v1/invites/${rawToken}/accept`).set(auth(nurseToken));
    const second = await request(app)
      .post(`/api/v1/invites/${rawToken}/accept`)
      .set(auth(nurseToken));

    // A used invite answers exactly like any other dead one.
    expect(second.status).toBe(404);
    expect(second.body.error.code).toBe('INVITE_INVALID');
  });
});
