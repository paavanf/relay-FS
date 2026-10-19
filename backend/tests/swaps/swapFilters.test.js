// swapFilters.test.js
// What an offer would take in return, through the API: stored tidy, checked
// strictly, changed only by the person who offered, and honoured by search.
//
// Wren and Sam each offer a day shift - normally a direct swap. When Wren
// will only take nights, it is gone, and the reason says so.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/db.js';
import { createApp } from '../../src/app.js';
import { auth } from '../helpers/orgBuilder.js';
import { swapWorld } from './swapWorld.js';

let app;
let world;

const url = (path = '') => `/api/v1/orgs/${world.orgId}/swap-requests${path}`;
const offer = async (person, days, body = {}) =>
  request(app).post(url()).set(auth(person.token)).send({ assignmentId: await world.shift(world.published, person.membershipId, days), ...body });
const change = (person, id, body) => request(app).patch(url(`/${id}`)).set(auth(person.token)).send(body);
const optionsOf = (person, id) => request(app).get(url(`/${id}/options`)).set(auth(person.token));

beforeAll(async () => {
  await startTestDb();
  app = createApp();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  world = await swapWorld(app);
});

describe('what an offer would take in return', () => {
  it('is stored sorted and listed once, and is any shift when left out', async () => {
    const filtered = await offer(world.worker, 5, { acceptableShiftFilters: { categories: ['night', 'day'], daysOfWeek: [6, 0] } });
    const open = await offer(world.sam, 7);

    expect(filtered.body.swapRequest.acceptableShiftFilters).toEqual({ categories: ['day', 'night'], daysOfWeek: [0, 6] });
    expect(open.body.swapRequest.acceptableShiftFilters).toEqual({ categories: [], daysOfWeek: [] });
  });

  it('is checked strictly', async () => {
    for (const acceptableShiftFilters of [{ categories: ['brunch'] }, { daysOfWeek: [1, 1] }, { daysOfWeek: [7] }, { shifts: ['day'] }]) {
      expect((await offer(world.worker, 5, { acceptableShiftFilters })).status).toBe(422);
    }
  });

  it('can be changed by the person who offered, and nobody else', async () => {
    const created = await offer(world.worker, 5);
    const id = created.body.swapRequest.id;

    expect((await change(world.manager, id, { acceptableShiftFilters: { categories: ['night'] } })).status).toBe(403);
    const changed = await change(world.worker, id, { acceptableShiftFilters: { categories: ['night'] } });
    expect(changed.status).toBe(200);
    expect(changed.body.swapRequest.acceptableShiftFilters.categories).toEqual(['night']);
  });

  it('rules a swap out of the search, says why, and lets it back in when widened', async () => {
    const wrens = (await offer(world.worker, 5, { acceptableShiftFilters: { categories: ['night'] } })).body.swapRequest.id;
    await offer(world.sam, 7);

    const narrow = await optionsOf(world.worker, wrens);
    expect(narrow.body.direct).toEqual([]);
    expect(narrow.body.noMatch.summary).toBe("1 offer checked: 1 didn't match what you said you'd take.");

    await change(world.worker, wrens, { acceptableShiftFilters: { categories: [] } });
    expect((await optionsOf(world.worker, wrens)).body.direct).toHaveLength(1);
  });
});
