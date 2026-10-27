// cleanupLegacyAuth.test.js
// The cleanup of what the old sign-in left (scripts/cleanup/), on the
// in-memory server:
//   - without --yes it counts what it found and changes nothing
//   - with --yes it removes the old fields and collections, and leaves every
//     account's name, email and sign-in link as they were
//   - run again, it finds nothing

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { startTestServer, stopTestDb, testServerUri } from '../helpers/db.js';
import { inDatabase } from '../helpers/demoSeed.js';
import { runCleanup } from '../../scripts/cleanup/runCleanup.js';

const DATABASE = 'relay-cleanup';
const db = () => mongoose.connection.db;
const clean = async (argv) => {
  const lines = [];
  const code = await runCleanup(argv, { MONGODB_URI: testServerUri(DATABASE) }, { log: (line) => lines.push(line) });
  return { code, lines };
};

beforeAll(async () => {
  await startTestServer();
  await inDatabase(DATABASE, async () => {
    await db().collection('users').insertMany([
      { name: 'Old Hand', email: 'old@example.com', passwordHash: '$argon2id$x', failedLoginAttempts: 2, lockedUntil: null },
      { name: 'Linked', email: 'linked@example.com', supabaseUserId: 'abc', passwordHash: '$argon2id$y' },
      { name: 'New', email: 'new@example.com', supabaseUserId: 'def' },
    ]);
    await db().collection('refreshtokens').insertOne({ userId: 'x', tokenHash: 'h' });
    await db().collection('passwordresettokens').insertOne({ userId: 'x', tokenHash: 'h' });
  });
}, 120_000);
afterAll(stopTestDb);

describe('cleaning up the old sign-in', () => {
  it('counts what it found and changes nothing without --yes', async () => {
    const { code, lines } = await clean([]);
    expect(code).toBe(0);
    expect(lines).toContain('  Users with an old password or lockout   2');
    expect(lines).toContain('  Collection refreshtokens   1 documents');
    expect(lines.join('\n')).not.toContain('mongodb://');
    await inDatabase(DATABASE, async () => expect(await db().collection('refreshtokens').countDocuments()).toBe(1));
  });

  it('removes the old fields and collections with --yes, and keeps everything else', async () => {
    expect((await clean(['--yes'])).code).toBe(0);

    await inDatabase(DATABASE, async () => {
      const users = await db().collection('users').find({}, { projection: { _id: 0 } }).sort({ email: 1 }).toArray();
      expect(users).toEqual([
        { name: 'Linked', email: 'linked@example.com', supabaseUserId: 'abc' },
        { name: 'New', email: 'new@example.com', supabaseUserId: 'def' },
        { name: 'Old Hand', email: 'old@example.com' },
      ]);
      const names = (await db().listCollections().toArray()).map((c) => c.name);
      expect(names).toEqual(['users']);
    });

    expect((await clean([])).lines).toContain('  Users with an old password or lockout   0');
  });

  it('refuses an address without a database name', async () => {
    expect((await runCleanup([], { MONGODB_URI: 'mongodb://127.0.0.1:9' }, { log: () => {} }))).toBe(1);
  });
});
