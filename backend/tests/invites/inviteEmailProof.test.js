// inviteEmailProof.test.js
// Accepting an invite takes a proven email as well as a matching one: a
// sign-in whose email nobody had to confirm is refused (EMAIL_NOT_PROVEN),
// and the invite stays usable for when the email is confirmed.

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { useEmptyDb } from '../helpers/apiTest.js';
import { auth, tokenFor } from '../helpers/identity.js';
import { signUp, createOrg, sendInvite } from '../helpers/orgBuilder.js';

const world = useEmptyDb();

describe('accepting an invite', () => {
  it('needs a proven email, and leaves the invite usable until there is one', async () => {
    const ownerToken = await signUp(world.app, 'Olive Owner', 'owner@example.com');
    const orgId = await createOrg(world.app, ownerToken);
    const { rawToken } = await sendInvite(world.app, { orgId, token: ownerToken, email: 'joiner@example.com' });
    const accept = async (token) => request(world.app).post(`/api/v1/invites/${rawToken}/accept`).set(auth(token));

    const unproven = await accept(await tokenFor({ email: 'joiner@example.com', emailVerified: false }));
    expect(unproven.status).toBe(403);
    expect(unproven.body.error.code).toBe('EMAIL_NOT_PROVEN');

    expect((await accept(await tokenFor({ email: 'joiner@example.com' }))).status).toBe(201);
  });
});
