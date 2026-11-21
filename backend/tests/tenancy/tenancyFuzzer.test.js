// tenancyFuzzer.test.js
// Proves one organisation can never reach another's data - and keeps proving
// it as routes are added, because the route list is read from the Express
// router itself (helpers/routeList.js), never written by hand. Two
// organisations, A and B, each with something of everything (tenancyWorld.js).
//
//   every org-scoped route, as A's owner, with B's orgId     -> 404
//   every one that names records, A's orgId with B's ids     -> 404
//       (never 200, never 403 - which would admit B exists - never 500)
//   every route but the public ones, with no token           -> 401
//   a route the fuzzer did not exercise                      -> the test fails

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestDb, stopTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { listRoutes, routeKey } from '../helpers/routeList.js';
import { tenancyWorld } from './tenancyWorld.js';
import { isOrgScoped, recipeFor, callRoute, callWithoutToken, namesRecords, outcome } from './fuzzCalls.js';
import { report } from '../engine/properties/report.js';

// Reachable with no token at all. Adding a route here is a decision: anything
// not listed must refuse a request without one.
const PUBLIC = new Set([
  'GET /api/health',
  'GET /api/v1/health',
  'GET /api/v1/config',
  'GET /api/v1/invites/:token',
  // Guarded by its own shared secret, not a sign-in - and absent (404) unless
  // SUPABASE_WEBHOOK_SECRET is set (middleware/requireWebhookSecret.js).
  'POST /api/v1/webhooks/supabase-auth',
]);

let app;
let routes;
let a;
let b;
const exercised = { otherOrg: new Set(), otherIds: new Set(), noToken: new Set() };

beforeAll(async () => {
  await startTestDb();
  app = createApp();
  routes = listRoutes(app);
  a = await tenancyWorld(app, 'a');
  b = await tenancyWorld(app, 'b');
}, 120_000);
afterAll(stopTestDb);

const orgRoutes = () => routes.filter(isOrgScoped);

async function expectEvery(list, call, expected, tally) {
  const wrong = [];
  for (const route of list) {
    const res = await call(route);
    tally.add(routeKey(route));
    if (res.status !== expected) wrong.push(outcome(route, res));
  }
  expect(wrong).toEqual([]);
}

describe('tenancy fuzzer', () => {
  it('knows how to call every org-scoped route, and lists only public routes that exist', () => {
    expect(orgRoutes().filter((route) => !recipeFor(route)).map(routeKey)).toEqual([]);
    const keys = new Set(routes.map(routeKey));
    expect([...PUBLIC].filter((key) => !keys.has(key))).toEqual([]);
  });

  it("answers 404 to another organisation's id, on every org-scoped route", async () => {
    const call = (route) => callRoute(app, route, { ids: b.ids, orgId: b.ids.orgId, token: a.ownerToken });
    await expectEvery(orgRoutes(), call, 404, exercised.otherOrg);
  });

  it("answers 404 to another organisation's records named under your own", async () => {
    const call = (route) => callRoute(app, route, { ids: b.ids, orgId: a.ids.orgId, token: a.ownerToken });
    await expectEvery(orgRoutes().filter((route) => namesRecords(route, b.ids)), call, 404, exercised.otherIds);
  });

  it('answers 401 without a token, on every route but the public ones', async () => {
    const call = (route) => callWithoutToken(app, route, a.ids);
    await expectEvery(routes.filter((route) => !PUBLIC.has(routeKey(route))), call, 401, exercised.noToken);
  });

  it('exercised every route the router has', () => {
    const missed = (list, tally) => list.map(routeKey).filter((key) => !tally.has(key));
    expect(missed(orgRoutes(), exercised.otherOrg)).toEqual([]);
    expect(missed(routes.filter((route) => !PUBLIC.has(routeKey(route))), exercised.noToken)).toEqual([]);
    report(
      `Tenancy fuzzer: ${routes.length} routes - ${exercised.otherOrg.size} org-scoped tried with another organisation's id, ` +
        `${exercised.otherIds.size} with its records under your own, ${exercised.noToken.size} without a token, ${PUBLIC.size} public`,
    );
  });
});
