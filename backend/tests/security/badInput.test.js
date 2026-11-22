// badInput.test.js
// Bad input on every write route is refused with a 4xx in the API's one
// error shape - never a 500. For each POST, PUT, PATCH and DELETE the router
// answers (read from the router itself, helpers/routeList.js, so a new route
// is checked too): malformed ids, a body with every field missing, fields of
// the wrong types, a list where an object belongs, JSON that does not parse,
// and a body over the 100 kB limit. Sent as an organisation's owner, so each
// request gets past sign-in to the checks that matter.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { listRoutes, routeKey } from '../helpers/routeList.js';
import { auth, buildOrg } from '../helpers/orgBuilder.js';

const WRITES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const UNKNOWN_ID = '64656d6f01000000000fffff'; // well formed, names nothing
const WRONG_TYPES = { name: 42, email: ['x'], startDate: { gt: '' }, entries: 'none', qualificationIds: 'x', note: { a: 1 }, reason: [1], role: 7 };
const OVER_LIMIT = { note: 'x'.repeat(200_000) };

let app;
let org;
let writes;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
  org = await buildOrg(app);
  writes = listRoutes(app).filter((route) => WRITES.has(route.method));
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

const pathOf = (route, id) => route.path.replace(/:(\w+)/g, (_match, name) => (name === 'orgId' ? org.orgId : id));

function send(route, id, { body, raw } = {}) {
  const req = request(app)[route.method.toLowerCase()](pathOf(route, id)).set(auth(org.owner.token));
  if (raw !== undefined) return req.set('Content-Type', 'application/json').send(raw);
  return body === undefined ? req : req.send(body);
}

// Every answer is a success or a refusal - never a server error - and every
// refusal says what was wrong in { error: { code, message } }.
async function expectOnlyRefusals(cases) {
  const failures = [];
  for (const route of writes) {
    for (const [label, call] of cases) {
      const res = await call(route);
      const shaped = res.status < 400 || (typeof res.body?.error?.code === 'string' && typeof res.body?.error?.message === 'string');
      if (res.status >= 500 || !shaped) failures.push(`${routeKey(route)} (${label}) -> ${res.status} ${JSON.stringify(res.body?.error ?? {}).slice(0, 120)}`);
    }
  }
  expect(failures).toEqual([]);
}

describe('bad input on every write route', () => {
  it('finds every write route', () => {
    expect(writes.length).toBeGreaterThanOrEqual(40);
  });

  it('refuses malformed and unknown ids, missing fields, wrong types and a list for a body', async () => {
    await expectOnlyRefusals([
      ['malformed ids', (route) => send(route, 'not-an-id', { body: {} })],
      ['missing fields', (route) => send(route, UNKNOWN_ID, { body: {} })],
      ['wrong types', (route) => send(route, UNKNOWN_ID, { body: WRONG_TYPES })],
      ['a list for a body', (route) => send(route, UNKNOWN_ID, { body: [1, 2, 3] })],
    ]);
  });

  it('refuses JSON that does not parse, and a body over the limit', async () => {
    await expectOnlyRefusals([
      ['malformed JSON', (route) => send(route, UNKNOWN_ID, { raw: '{"name": ' })],
      ['over 100 kB', (route) => send(route, UNKNOWN_ID, { body: OVER_LIMIT })],
    ]);
    const res = await send(writes[0], UNKNOWN_ID, { body: OVER_LIMIT });
    expect(res.status).toBe(413);
  });
});
