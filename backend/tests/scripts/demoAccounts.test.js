// demoAccounts.test.js
// The demo's sign-ins in Supabase (scripts/demo/demoAccounts.js), against a
// stand-in for the Admin API - no Supabase project is involved:
//   - missing accounts are created, confirmed, with the password, name and marker
//   - accounts it made get the password and name back, and are not doubled
//   - a demo address held by an account without the marker stops everything
//   - nothing outside the .test domain is ever touched

import { describe, it, expect } from 'vitest';
import { keepDemoAccounts } from '../../scripts/demo/demoAccounts.js';
import { fakeSupabaseAdmin as fakeAdmin } from '../helpers/fakeSupabaseAdmin.js';

const PEOPLE = [
  { email: 'owner@relay.test', name: 'Olu Owner' },
  { email: 'asha@relay.test', name: 'Asha Patel' },
];
const keep = (admin, people = PEOPLE) => keepDemoAccounts(admin, { people, password: 'relay-demo-2026' });

describe('the demo accounts in Supabase', () => {
  it('creates each missing account, confirmed, with the password, name and marker', async () => {
    const admin = fakeAdmin();
    const ids = await keep(admin);

    expect([...ids]).toEqual([['owner@relay.test', 'supabase-1'], ['asha@relay.test', 'supabase-2']]);
    expect(admin.users[0]).toMatchObject({
      email: 'owner@relay.test',
      password: 'relay-demo-2026',
      email_confirm: true,
      user_metadata: { name: 'Olu Owner' },
      app_metadata: { relay_demo: true },
    });
  });

  it('puts the password back on the accounts it made, without making them again', async () => {
    const admin = fakeAdmin();
    await keep(admin);
    admin.users[0].password = 'changed-by-a-visitor';

    const ids = await keep(admin);
    expect(admin.users).toHaveLength(2);
    expect(admin.users[0].password).toBe('relay-demo-2026');
    expect(ids.get('owner@relay.test')).toBe('supabase-1');
  });

  it('stops, changing nothing, when a demo address belongs to an account it did not make', async () => {
    const admin = fakeAdmin([{ id: 'someone', email: 'asha@relay.test', app_metadata: {} }]);
    await expect(keep(admin)).rejects.toThrow('asha@relay.test already belong to Supabase accounts the seed did not make');
    expect(admin.calls).toEqual(['list']);
  });

  it('never touches an address outside the .test domain', async () => {
    const admin = fakeAdmin();
    await expect(keep(admin, [{ email: 'real@example.com', name: 'Real' }])).rejects.toThrow('must be on .test addresses');
    expect(admin.calls).toEqual([]);
  });

  it("passes on Supabase's refusal, naming the account", async () => {
    const admin = { ...fakeAdmin(), createUser: async () => ({ data: null, error: { message: 'bad_jwt' } }) };
    await expect(keep(admin)).rejects.toThrow('Supabase refused the demo account owner@relay.test: bad_jwt');
  });
});
