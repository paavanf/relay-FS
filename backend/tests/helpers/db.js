import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet;

/**
 * Boots an in-memory MongoDB replica set. A replica set (rather than a single
 * mongod) is required because Relay relies on multi-document transactions.
 */
export async function startTestDb() {
  if (replSet) return mongoose.connection;

  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
    instanceOpts: [{ launchTimeout: 60_000 }],
  });

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
