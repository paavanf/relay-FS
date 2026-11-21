// seedDemoSupabase.test.js
// The demo seed keeps the demo's sign-ins in Supabase (scripts/demo/
// demoAccounts.js), here against a stand-in for the Admin API and the
// in-memory server - no Supabase project involved:
//   - every demo person gets a confirmed account with the demo password,
//     and their Relay account is linked to it, so a token for it signs
//     straight into the demo
//   - a rerun resets those accounts rather than making more
//   - a demo address held by an account the seed did not make stops it
//     before anything is written, in Supabase or in MongoDB
//   - with no Admin API to use, it refuses to run at all

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { startTestServer, stopTestDb, testServerUri } from '../helpers/db.js';
import { inDatabase, DEMO_ANCHOR } from '../helpers/demoSeed.js';
import { fakeSupabaseAdmin } from '../helpers/fakeSupabaseAdmin.js';
import { tokenFor } from '../helpers/identity.js';
import { main } from '../../scripts/demo/runSeed.js';
import { createApp } from '../../src/app.js';
import { User, Organisation } from '../../src/models/index.js';
import { DEMO_PASSWORD } from '../../scripts/demo/ward.js';

const seedInto = (database, accounts) => main(['--yes'], { MONGODB_URI: testServerUri(database) }, { anchor: DEMO_ANCHOR, accounts });

let printed;

beforeAll(async () => {
  printed = vi.spyOn(console, 'log').mockImplementation(() => {});
  await startTestServer();
}, 120_000);
afterAll(async () => {
  vi.restoreAllMocks();
  await stopTestDb();
});

describe('the demo seed and Supabase', () => {
  it('makes a confirmed account for everyone in the demo, and links their Relay account to it', async () => {
    const admin = fakeSupabaseAdmin();
    expect(await seedInto('relay-demo', admin)).toBe(0);
    expect(admin.users).toHaveLength(14);
    expect(admin.users.every((user) => user.password === DEMO_PASSWORD && user.email_confirm && user.app_metadata.relay_demo)).toBe(true);

    await inDatabase('relay-demo', async () => {
      const owner = await User.findOne({ email: 'owner@relay.test' }).lean();
      expect(owner.supabaseUserId).toBe(admin.users.find((user) => user.email === 'owner@relay.test').id);

      const token = await tokenFor({ email: 'owner@relay.test', sub: owner.supabaseUserId });
      const me = await request(createApp()).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
      expect(me.body.user).toMatchObject({ id: String(owner._id), isDemo: true });
      expect(me.body.memberships).toEqual([expect.objectContaining({ role: 'owner', isDemo: true })]);
    });

    expect(await seedInto('relay-demo', admin)).toBe(0);
    expect(admin.users).toHaveLength(14);
    await inDatabase('relay-demo', async () => {
      expect(await User.countDocuments({ supabaseUserId: { $in: admin.users.map((user) => user.id) } })).toBe(14);
    });
  }, 180_000);

  it('stops before writing anything when a demo address belongs to an account it did not make', async () => {
    const admin = fakeSupabaseAdmin([{ id: 'someone', email: 'jonas@relay.test', app_metadata: {} }]);
    expect(await seedInto('stranger-demo', admin)).toBe(1);
    expect(admin.users).toHaveLength(1);
    await inDatabase('stranger-demo', async () => expect(await Organisation.countDocuments()).toBe(0));
  });

  it('refuses to run with no way to keep the demo accounts', async () => {
    const lines = [];
    printed.mockImplementation((line) => lines.push(line));
    expect(await main(['--yes'], { MONGODB_URI: testServerUri('none-demo') }, { anchor: DEMO_ANCHOR })).toBe(1);
    expect(lines.join('\n')).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });
});
