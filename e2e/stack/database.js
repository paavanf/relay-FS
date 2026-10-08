// database.js
// Run by the stack as a child process: starts an in-memory MongoDB replica
// set - a replica set because Relay uses transactions - prints its address as
// one line, E2E_DATABASE <uri>, and keeps it running until the stack writes
// "stop" or closes this process's input.
//
// A child process because Playwright's own module loader cannot load
// mongodb-memory-server on Node 22. If this process is killed outright,
// mongodb-memory-server's watchdog still takes mongod down with it.

import { MongoMemoryReplSet } from 'mongodb-memory-server';

const name = process.argv[2];
if (!/-demo$/.test(name ?? '')) {
  console.error('database: pass a database name ending in -demo');
  process.exit(1);
}

const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: 'wiredTiger' },
  instanceOpts: [{ launchTimeout: 60_000 }],
});

console.log(`E2E_DATABASE ${replSet.getUri(name)}`);

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await replSet.stop();
  process.exit(0);
}

process.stdin.on('data', (chunk) => {
  if (chunk.toString().includes('stop')) stop();
});
process.stdin.on('end', stop);
