// runCleanup.js
// The legacy sign-in cleanup from start to finish: connect, count what the
// old sign-in left (legacyAuth.js), and - only with --yes - remove it.
//
// Kept apart from cleanup-legacy-auth.js so the tests can call it against an
// in-memory database. Like the demo seed it prints the database's name and
// never its address, blanks credentials out of any error (demo/guards.js),
// and returns an exit code rather than exiting.

import mongoose from 'mongoose';
import { databaseNameOf, scrub } from '../demo/guards.js';
import { findLegacyAuth, removeLegacyAuth } from './legacyAuth.js';

export async function runCleanup(argv, env, { log = console.log } = {}) {
  const uri = env.MONGODB_URI?.trim();
  const database = databaseNameOf(uri);

  log('Relay: remove what the old sign-in left behind\n');
  log(`  Database   ${database ?? '(none named)'}`);
  if (!database) {
    log('\nSet MONGODB_URI to the database to clean, with its name before the "?".');
    return 1;
  }

  try {
    await mongoose.connect(uri, { dbName: database, serverSelectionTimeoutMS: 10_000 });
    const db = mongoose.connection.db;
    const found = await findLegacyAuth(db);

    log(`  Users with an old password or lockout   ${found.users}`);
    for (const [name, count] of Object.entries(found.collections)) log(`  Collection ${name}   ${count} documents`);

    if (!argv.includes('--yes')) {
      log('\nNothing was changed. Run it again with -- --yes to remove these.');
      return 0;
    }
    await removeLegacyAuth(db);
    log('\nRemoved. Every account, its organisations and its sign-in link are as they were.');
    return 0;
  } catch (err) {
    log(`\nThe cleanup stopped: ${scrub(err?.message ?? err, uri)}`);
    return 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}
