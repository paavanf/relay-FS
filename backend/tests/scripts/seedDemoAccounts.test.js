// seedDemoAccounts.test.js
// The login page's "Try the demo" names three accounts and says what each
// one shows (frontend/src/pages/auth/login/demoAccounts.js, read here so the
// two can never drift apart). The seed picks its swap stories with the
// engine, so this proves those accounts still show what the page promises:
//
//   the owner        owns the ward, and has a swap waiting for approval
//   a swap waiting   has a proposal waiting for an answer, under the bell too
//   a direct swap    has an open offer with a direct swap to propose
//
// For two weeks well apart, since the demo is reseeded every night - and
// ahead of today, so the seeded proposals are still open when read.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { startTestServer, stopTestDb, testServerUri } from '../helpers/db.js';
import { inDatabase } from '../helpers/demoSeed.js';
import { main } from '../../scripts/demo/runSeed.js';
import { createApp } from '../../src/app.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, DEMO_ORG_ID } from '../../../frontend/src/pages/auth/login/demoAccounts.js';

beforeAll(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  await startTestServer();
}, 120_000);
afterAll(async () => {
  vi.restoreAllMocks();
  await stopTestDb();
});

// The Monday `weeks` from this week's, as YYYY-MM-DD.
function mondayIn(weeks) {
  const day = new Date();
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7) + weeks * 7);
  return day.toISOString().slice(0, 10);
}

async function signIn(app, email) {
  const { body } = await request(app).post('/api/v1/auth/login').send({ email, password: DEMO_PASSWORD });
  const [membership] = body.memberships;
  const get = (path) => request(app).get(`/api/v1/orgs/${membership.orgId}${path}`).set('Authorization', `Bearer ${body.accessToken}`);
  return { membership, get };
}

describe('the demo accounts the login page offers', () => {
  it('are, in order, the owner, a worker with a swap waiting and a worker with a direct swap', () => {
    expect(DEMO_ACCOUNTS.map((account) => account.email)).toEqual(['owner@relay.test', 'jonas@relay.test', 'elif@relay.test']);
  });

  for (const weeks of [2, 9]) {
    it(`show what the page says, in a demo seeded ${weeks} weeks ahead`, async () => {
      expect(await main(['--yes'], { MONGODB_URI: testServerUri('relay-demo') }, { anchor: mondayIn(weeks) })).toBe(0);

      await inDatabase('relay-demo', async () => {
        const app = createApp();
        const [owner, waiting, direct] = await Promise.all(DEMO_ACCOUNTS.map((account) => signIn(app, account.email)));

        // The page signs in straight to this organisation, by the id it holds.
        expect(owner.membership).toMatchObject({ role: 'owner', isDemo: true, orgId: DEMO_ORG_ID });
        expect((await owner.get('/swap-chains/summary')).body.awaitingApproval).toBe(1);

        expect((await waiting.get('/swap-chains/summary')).body.waitingForYou).toBe(1);
        const unread = (await waiting.get('/notifications?unread=true')).body.notifications;
        expect(unread.map((notification) => notification.type)).toContain('swap_proposed');

        const offers = (await direct.get('/swap-requests')).body.swapRequests.filter((offer) => offer.mine && offer.status === 'open');
        expect(offers).toHaveLength(1);
        expect((await direct.get(`/swap-requests/${offers[0].id}/options`)).body.direct.length).toBeGreaterThan(0);
      });
    }, 180_000);
  }
});
