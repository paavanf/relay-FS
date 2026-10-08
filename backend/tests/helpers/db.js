// db.js
// The in-memory MongoDB every test file runs against, and the helpers that
// start, empty and stop it.

import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet;

/**
 * Boots an in-memory MongoDB replica set without connecting to it. A replica
 * set (rather than a single mongod) is required because Relay relies on
 * multi-document transactions.
 */
export async function startTestServer() {
  replSet ??= await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
    // A cold CI runner downloads the mongod binary before it can start, which
    // easily exceeds the default launch timeout. Without this margin the suite
    // fails intermittently on CI rather than cleanly.
    instanceOpts: [{ launchTimeout: 60_000 }],
  });
  return replSet;
}

/**
 * The in-memory server's address with a database name in it, for code under
 * test that opens its own connection from MONGODB_URI (the demo seed).
 */
export function testServerUri(dbName) {
  return replSet.getUri(dbName);
}

/** Boots the in-memory replica set and connects Mongoose to it. */
export async function startTestDb() {
  if (replSet) return mongoose.connection;

  await startTestServer();
  await mongoose.connect(replSet.getUri(), { dbName: 'relay-test' });
  return mongoose.connection;
}

export async function stopTestDb() {
  await mongoose.disconnect();
  await replSet?.stop();
  replSet = undefined;
}

export async function clearTestDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}
