// check-db.js
// A read-only connectivity check for the MongoDB that backend/.env points at.
//
// THIS SCRIPT NEVER WRITES ANYTHING. It connects, runs `ping` and `hello`,
// lists the collections with an estimated document count, and disconnects.
// It never inserts, updates or deletes, and it cannot create a collection or
// an index by accident either: no models are imported, and Mongoose's
// autoIndex and autoCreate are switched off. (The app connects with autoIndex
// ON in development, which is why this does not reuse connectDb().)
//
// It never prints the connection string. The credentials and hosts taken from
// it are scrubbed out of any error message before that message is shown.
//
//   npm run db:check                 exit code 0 = reachable, 1 = not
//   npm run db:check -- relay-demo   also lists another database on the same
//                                    cluster, over the same read-only connection
//
// The diagnosis, the scrubbing and the printing are in scripts/dbCheck/.

import mongoose from 'mongoose';
import { secretPartsOf } from './dbCheck/scrub.js';
import { printCause } from './dbCheck/causes.js';
import { line, describeTopology, listCollections, printCollections } from './dbCheck/report.js';

// The same timeout the app uses (src/config/db.js), so this fails exactly as
// fast as the app would instead of hanging.
const TIMEOUT_MS = 10_000;

async function main() {
  console.log('Relay database check (read-only)\n');

  // Load backend/.env the way the app does: Node's built-in parser, the same
  // one behind `--env-file-if-exists=.env`, with the same rule - a variable
  // already set in your shell wins over the file.
  const fromShell = process.env.MONGODB_URI !== undefined;
  try {
    process.loadEnvFile(new URL('../.env', import.meta.url));
  } catch {
    // No .env at all, like the -if-exists flag. Reported just below.
  }

  // The app quietly falls back to a local database when this is missing in
  // development. Here that would mislead - "cannot reach 127.0.0.1" says
  // nothing about Atlas - so stop and say what is actually wrong.
  if (!process.env.MONGODB_URI?.trim()) {
    line('Connection string', 'NOT SET');
    console.log('\nLikely cause: MONGODB_URI is missing from backend/.env.\n\nWhat to do:');
    console.log('  1. Copy backend/.env.example to backend/.env if it does not exist.');
    console.log('  2. Atlas -> Connect -> Drivers, copy the string into MONGODB_URI,');
    console.log('     with the database name (/relay-dev) before the "?".');
    return 1;
  }

  // Read through the app's own config module, so the value is validated
  // exactly the way the app validates it.
  const { env } = await import('../src/config/env.js');
  const uri = env.MONGODB_URI;
  const secrets = secretPartsOf(uri);
  const database = uri.match(/^[^/]+\/\/[^/]+\/([^?]+)/)?.[1] ?? 'none - would default to "test"';

  line('Connection string', `present, ${uri.split('://')[0]}://, database "${database}"`);
  if (fromShell) line('', 'taken from your shell environment, which overrides backend/.env');

  const startedAt = Date.now();
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: TIMEOUT_MS, autoIndex: false, autoCreate: false });
    line('Connected', `yes, in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);

    const db = mongoose.connection.db;
    await db.command({ ping: 1 });
    line('Ping', 'ok');
    line('Replica set', describeTopology(await db.command({ hello: 1 })));

    printCollections(mongoose.connection.name, await listCollections(db));

    // Any other database named on the command line, e.g. relay-demo.
    for (const name of process.argv.slice(2).filter((arg) => /^[\w-]+$/.test(arg))) {
      console.log('');
      printCollections(name, await listCollections(mongoose.connection.client.db(name)));
    }

    console.log('\nThe database is reachable.');
    return 0;
  } catch (err) {
    if (mongoose.connection.readyState === 1) {
      line('Connected', 'yes, but reading the database failed');
    } else {
      line('Connected', `NO - failed after ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
    }
    printCause(err, secrets);
    return 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

process.exitCode = await main();
