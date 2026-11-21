// linkRace.test.js
// The race a page's first burst of requests can run (syncUser.service.js):
// request B looks for its sign-in and finds nothing; request A creates the
// account; B then finds that account by email - already linked, to B's own
// sign-in. That is the same person, not a clash, so B gets the account.
// Driven through linkByEmail directly, since the API cannot be made to
// interleave two requests at exactly that point.

import { describe, it, expect } from 'vitest';
import { useEmptyDb } from '../helpers/apiTest.js';
import { linkByEmail } from '../../src/services/identity/linkByEmail.js';
import { User } from '../../src/models/index.js';

useEmptyDb();

const identity = { externalId: 'supabase-1', email: 'busy@example.com', name: 'Busy', emailProven: true };

describe('linking, when another request got there first', () => {
  it('hands back the account a racing request made for the same sign-in', async () => {
    const made = await User.create({ name: 'Busy', email: 'busy@example.com', supabaseUserId: 'supabase-1' });
    expect(String((await linkByEmail(made, identity))._id)).toBe(String(made._id));
  });

  it('still refuses an account linked to a different live sign-in', async () => {
    const other = await User.create({ name: 'Busy', email: 'busy@example.com', supabaseUserId: 'supabase-2' });
    await expect(linkByEmail(other, identity)).rejects.toMatchObject({ statusCode: 409 });
  });
});
