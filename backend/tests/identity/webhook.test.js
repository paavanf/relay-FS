// webhook.test.js
// POST /api/v1/webhooks/supabase-auth, with SUPABASE_WEBHOOK_SECRET set:
//   - refused without the secret (401), or with a body that is not an event (422)
//   - UPDATE copies the new email onto the linked Relay user
//   - DELETE takes the person out of every organisation but keeps the
//     account, refuses their old tokens, and lets them back on a new sign-up
//   - the last owner of an organisation stays its owner
//   - repeats, unknown people and INSERTs change nothing, and answer 204

import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { useEmptyDb } from '../helpers/apiTest.js';
import { auth, tokenFor, subFor } from '../helpers/identity.js';
import { buildOrg } from '../helpers/orgBuilder.js';
import { Membership, User } from '../../src/models/index.js';

const SECRET = vi.hoisted(() => (process.env.SUPABASE_WEBHOOK_SECRET = 'webhook-secret-for-tests-'.padEnd(48, 'w')));

const world = useEmptyDb();
const send = (body, authorization = `Bearer ${SECRET}`) =>
  request(world.app).post('/api/v1/webhooks/supabase-auth').set('Authorization', authorization).send(body);
const deleted = (email) => ({ type: 'DELETE', record: null, old_record: { id: subFor(email), email } });
const statusesOf = async (email) => {
  const user = await User.findOne({ email });
  return (await Membership.find({ userId: user._id }).lean()).map((m) => m.status);
};

describe('the Supabase Auth webhook', () => {
  it('refuses a call without the secret, or with a body that is not an auth event', async () => {
    for (const authorization of ['', 'Bearer wrong', `Basic ${SECRET}`]) {
      expect((await send(deleted('a@example.com'), authorization)).status).toBe(401);
    }
    expect((await send({ type: 'TRUNCATE' })).status).toBe(422);
    expect((await send({ type: 'DELETE', record: null })).status).toBe(422);
  });

  it('copies a changed email onto the linked user', async () => {
    await request(world.app).get('/api/v1/auth/me').set(auth(await tokenFor({ email: 'a@example.com' })));
    const update = { type: 'UPDATE', record: { id: subFor('a@example.com'), email: 'B@example.com' }, old_record: null };
    expect((await send(update)).status).toBe(204);
    expect(await User.countDocuments({ email: 'b@example.com' })).toBe(1);
  });

  it('takes a deleted person out of every organisation, keeping the account, and lets them back', async () => {
    const { worker } = await buildOrg(world.app);
    const before = await User.findOne({ email: 'worker-a@example.com' }).lean();

    expect((await send(deleted('worker-a@example.com'))).status).toBe(204);
    expect(await statusesOf('worker-a@example.com')).toEqual(['inactive']);
    expect((await request(world.app).get('/api/v1/auth/me').set(auth(worker.token))).status).toBe(401);

    expect((await send(deleted('worker-a@example.com'))).status).toBe(204);
    const back = await request(world.app).get('/api/v1/auth/me').set(auth(await tokenFor({ email: 'worker-a@example.com', sub: 'new-id' })));
    expect(back.body.user.id).toBe(String(before._id));
    expect(back.body.memberships).toEqual([]);
  });

  it('keeps the last owner of an organisation as its owner', async () => {
    await buildOrg(world.app);
    expect((await send(deleted('owner-a@example.com'))).status).toBe(204);
    expect(await statusesOf('owner-a@example.com')).toEqual(['active']);
    expect((await User.findOne({ email: 'owner-a@example.com' })).identityDeletedAt).toBeInstanceOf(Date);
  });

  it('answers 204 for someone it does not know, and for an INSERT', async () => {
    expect((await send(deleted('nobody@example.com'))).status).toBe(204);
    expect((await send({ type: 'INSERT', record: { id: 'x', email: 'x@example.com' }, old_record: null })).status).toBe(204);
    expect(await User.countDocuments()).toBe(0);
  });
});
