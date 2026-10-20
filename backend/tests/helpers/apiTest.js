// apiTest.js
// The hooks most API test files share: start the in-memory database and an
// app once, empty the database before every test - then run `seed`, if given,
// to put back what every test starts from - and stop it all after the file.
// useEmptyDb() returns an object whose `app` is set once the file starts, and
// which holds whatever `seed` returns, refreshed before each test.

import { beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from './db.js';
import { createApp } from '../../src/app.js';

export function useEmptyDb(seed) {
  const world = {};
  beforeAll(async () => {
    await startTestDb();
    world.app = createApp();
  }, 120_000);
  afterAll(async () => {
    await stopTestDb();
  });
  beforeEach(async () => {
    await clearTestDb();
    if (seed) Object.assign(world, await seed(world.app));
  });
  return world;
}
