// signIn.test.js
// What requests with a sign-in do to Relay's users (services/identity),
// through the API as a browser sends them:
//   - a new identity gets a new Relay user; the same identity, the same one
//   - an account from before Supabase is linked by email, kept whole - same
//     id, same memberships - but only when the email is proven
//   - an email linked to a different live sign-in is refused (409)
//   - a changed email is copied when proven and free; never for a demo account
//   - a deleted sign-in's tokens are refused, and the account can come back
//   - ten first requests at once make one user

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { useEmptyDb } from '../helpers/apiTest.js';
import { auth, tokenFor, subFor } from '../helpers/identity.js';
import { createOrg } from '../helpers/orgBuilder.js';
import { User } from '../../src/models/index.js';
import { demoId } from '../../src/config/demo.js';

const world = useEmptyDb();
const me = async (token) => request(world.app).get('/api/v1/auth/me').set(auth(await token));
const sendsBack = (res) => ({ status: res.status, code: res.body.error?.code });

describe('signing in', () => {
  it('creates a Relay user on the first request, and finds the same one after', async () => {
    const first = await me(tokenFor({ email: 'New@Example.com', name: 'New Person' }));
    expect(first.status).toBe(200);
    expect(first.body.user).toMatchObject({ email: 'new@example.com', name: 'New Person', isDemo: false });

    const again = await me(tokenFor({ email: 'new@example.com' }));
    expect(again.body.user.id).toBe(first.body.user.id);
    expect(await User.find({}).lean()).toMatchObject([{ supabaseUserId: subFor('new@example.com') }]);
  });

  it('links an account from before Supabase by email, keeping its id and organisations', async () => {
    const before = await me(tokenFor({ email: 'old@example.com', name: 'Old Hand' }));
    await createOrg(world.app, await tokenFor({ email: 'old@example.com' }), 'Ward Old');
    await User.updateOne({ email: 'old@example.com' }, { $unset: { supabaseUserId: 1 } });

    const after = await me(tokenFor({ email: 'old@example.com', sub: 'supabase-new-id' }));
    expect(after.body.user.id).toBe(before.body.user.id);
    expect(after.body.memberships.map((m) => m.orgName)).toEqual(['Ward Old']);
    expect((await User.findOne({ email: 'old@example.com' })).supabaseUserId).toBe('supabase-new-id');
  });

  it('refuses to link that account while the email is unproven', async () => {
    await User.create({ name: 'Old Hand', email: 'old@example.com' });
    const res = await me(tokenFor({ email: 'old@example.com', emailVerified: false }));
    expect(sendsBack(res)).toEqual({ status: 403, code: 'EMAIL_NOT_PROVEN' });
    expect((await User.findOne({ email: 'old@example.com' })).supabaseUserId).toBeUndefined();
  });

  it('refuses an email already linked to a different live sign-in', async () => {
    await me(tokenFor({ email: 'taken@example.com', sub: 'first-id' }));
    expect(sendsBack(await me(tokenFor({ email: 'taken@example.com', sub: 'second-id' })))).toEqual({ status: 409, code: 'CONFLICT' });
  });

  it('copies a changed email when proven and free, and keeps the old one otherwise', async () => {
    await me(tokenFor({ email: 'c@example.com' }));
    await me(tokenFor({ email: 'a@example.com', sub: 'moving-id' }));

    expect((await me(tokenFor({ email: 'b@example.com', sub: 'moving-id' }))).body.user.email).toBe('b@example.com');
    expect((await me(tokenFor({ email: 'c@example.com', sub: 'moving-id' }))).body.user.email).toBe('b@example.com');
    expect((await me(tokenFor({ email: 'd@example.com', sub: 'moving-id', emailVerified: false }))).body.user.email).toBe('b@example.com');
  });

  it("never changes a demo account's email", async () => {
    await User.create({ _id: demoId('user', 1), name: 'Demo Owner', email: 'owner@relay.test', supabaseUserId: 'demo-id' });
    const res = await me(tokenFor({ email: 'someone@example.com', sub: 'demo-id' }));
    expect(res.body.user).toMatchObject({ email: 'owner@relay.test', isDemo: true });
  });

  it("refuses a deleted sign-in's tokens, and links the account again on a new sign-up", async () => {
    const before = await me(tokenFor({ email: 'gone@example.com' }));
    await User.updateOne({ email: 'gone@example.com' }, { $set: { identityDeletedAt: new Date() } });
    expect((await me(tokenFor({ email: 'gone@example.com' }))).status).toBe(401);

    const back = await me(tokenFor({ email: 'gone@example.com', sub: 'new-sign-up' }));
    expect(back.body.user.id).toBe(before.body.user.id);
    expect((await User.findById(before.body.user.id)).identityDeletedAt).toBeNull();
  });

  it('makes one user from ten first requests at once', async () => {
    const token = await tokenFor({ email: 'busy@example.com' });
    const answers = await Promise.all(Array.from({ length: 10 }, () => me(token)));
    expect(answers.map((res) => res.status)).toEqual(Array(10).fill(200));
    expect(new Set(answers.map((res) => res.body.user.id)).size).toBe(1);
    expect(await User.countDocuments()).toBe(1);
  });

  it('refuses a request with no token, a bad one, or an expired one', async () => {
    expect((await request(world.app).get('/api/v1/auth/me')).status).toBe(401);
    expect((await me('not-a-token')).status).toBe(401);
    expect((await me(tokenFor({ email: 'late@example.com', expiresIn: -60 }))).status).toBe(401);
  });
});
