// runSeed.js
// The demo seed from start to finish: check the guards, connect, remove the
// last run's ward, build a new one - people, rosters and open swap requests -
// and print how to sign in.
//
// Kept apart from seed-demo.js so the test suite can call main() against an
// in-memory database with arguments and an environment of its own. It
// returns an exit code rather than exiting, for the same reason.

import mongoose from 'mongoose';
import { databaseNameOf, refusalFor, scrub } from './guards.js';
import { removeDemoData, emailsTakenByOthers } from './reset.js';
import { writeWard } from './writeWard.js';
import { writeRosters } from './writeRosters.js';
import { writeSwapRequests } from './writeSwapRequests.js';
import { printSummary } from './printSummary.js';
import { DEMO_USER_IDS, DEMO_EMAILS } from './wardDocs.js';
import { currentMonday } from './dates.js';
import { WARD } from './ward.js';

/**
 * @param {string[]} argv   the command-line arguments after the script name
 * @param {Object} env      the environment to read MONGODB_URI from
 * @param {string} [options.anchor]  a Monday to build around, for tests;
 *                          otherwise this week's Monday
 * @returns {Promise<number>} the exit code: 0 done, 1 refused or failed
 */
export async function main(argv, env, { anchor } = {}) {
  const uri = env.MONGODB_URI?.trim();
  const database = databaseNameOf(uri);

  console.log('Relay demo seed\n');
  console.log(`  Database   ${database ?? '(none named)'}`);

  const refusal = refusalFor({ uri, database, argv });
  if (refusal) {
    console.log(`\n${refusal}`);
    return 1;
  }

  try {
    // dbName repeats the name the guard just checked, so the database that
    // passed the check is the one written to, whatever else the string says.
    await mongoose.connect(uri, { dbName: database, serverSelectionTimeoutMS: 10_000 });

    const taken = await emailsTakenByOthers(DEMO_EMAILS, DEMO_USER_IDS);
    if (taken.length > 0) {
      console.log(`\nStopped before changing anything: ${taken.join(', ')} already belong to accounts the seed did not create.`);
      console.log('Delete those accounts yourself if they are leftovers, then run the seed again.');
      return 1;
    }

    await removeDemoData(DEMO_USER_IDS);
    console.log('\nRemoved the previous demo ward, if there was one.');

    const monday = anchor ?? currentMonday(WARD.timezone);
    const ward = await writeWard({ anchor: monday });
    const { rosters } = await writeRosters({ anchor: monday });
    const swaps = await writeSwapRequests({ anchor: monday });

    printSummary({ ward, rosters, swaps });
    return 0;
  } catch (err) {
    console.log(`\nThe seed stopped: ${scrub(err?.message ?? err, uri)}`);
    console.log('Only demo data was being written. Run it again to start over; npm run db:check diagnoses connection problems.');
    return 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}
