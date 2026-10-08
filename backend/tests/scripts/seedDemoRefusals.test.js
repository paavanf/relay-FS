// seedDemoRefusals.test.js
// The demo seed's refusals, run against the in-memory server - never a real
// database. Each refusal must leave its database exactly as it found it.

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { startTestServer, stopTestDb } from '../helpers/db.js';
import { seed, inDatabase, collectionsIn } from '../helpers/demoSeed.js';
import { User, Organisation } from '../../src/models/index.js';

let log;
const printed = () => log.mock.calls.flat().join('\n');

beforeAll(async () => {
  await startTestServer();
}, 120_000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(() => {
  log = vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the demo seed guards', () => {
  it('refuses a database whose name does not end in -demo, and writes nothing', async () => {
    expect(await seed(['--yes'], 'relay-dev')).toBe(1);
    expect(printed()).toContain('Database   relay-dev');
    expect(printed()).toContain('must end in "-demo"');
    expect(await collectionsIn('relay-dev')).toEqual([]);
  });

  it('refuses without --yes, and writes nothing', async () => {
    expect(await seed([], 'quiet-demo')).toBe(1);
    expect(printed()).toContain('npm run seed:demo -- --yes');
    expect(await collectionsIn('quiet-demo')).toEqual([]);
  });

  it('stops before changing anything when a demo email belongs to someone else', async () => {
    await inDatabase('taken-demo', () => User.create({ name: 'By Hand', email: 'owner@relay.test', passwordHash: 'x' }));

    expect(await seed(['--yes'], 'taken-demo')).toBe(1);
    expect(printed()).toContain('owner@relay.test already belong');
    expect(await inDatabase('taken-demo', () => User.countDocuments())).toBe(1);
    expect(await inDatabase('taken-demo', () => Organisation.countDocuments())).toBe(0);
  });
});
