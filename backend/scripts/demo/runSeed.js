// runSeed.js
// The demo seed from start to finish: check the guards, connect, keep the
// demo's sign-ins in Supabase (demoAccounts.js), remove the last run's ward,
// build a new one - people, rosters, open swap requests and two proposed
// swaps - and print how to sign in.
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
import { writeSwapProposals } from './writeSwapProposals.js';
import { printSummary } from './printSummary.js';
import { keepDemoAccounts } from './demoAccounts.js';
import { supabaseAdmin } from '../supabase/admin.js';
import { DEMO_USER_IDS, DEMO_EMAILS, emailOf } from './wardDocs.js';
import { currentMonday } from './dates.js';
import { WARD, PEOPLE, DEMO_PASSWORD } from './ward.js';

// Who the demo's Supabase accounts are for.
const DEMO_PEOPLE = PEOPLE.map((person) => ({ email: emailOf(person), name: person.name }));

/**
 * @param {string[]} argv   the command-line arguments after the script name
 * @param {Object} env      the environment to read MONGODB_URI from
 * @param {string} [options.anchor]  a Monday to build around, for tests;
 *                          otherwise this week's Monday
 * @param {Object|false} [options.accounts]  the Supabase Admin API to keep the
 *                          demo's sign-ins with; by default made from env's
 *                          SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. false
 *                          leaves Supabase out - only for the in-memory runs
 *                          (tests, e2e), whose sign-ins link by email
 * @returns {Promise<number>} the exit code: 0 done, 1 refused or failed
 */
export async function main(argv, env, { anchor, accounts = supabaseAdmin(env) } = {}) {
  const uri = env.MONGODB_URI?.trim();
  const database = databaseNameOf(uri);

  console.log('Relay demo seed\n');
  console.log(`  Database   ${database ?? '(none named)'}`);

  const refusal = refusalFor({ uri, database, argv });
  if (refusal) {
    console.log(`\n${refusal}`);
    return 1;
  }
  // null: no Admin API could be made, and nobody said to leave Supabase out.
  if (accounts === null) {
    console.log('\nSet SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY: the demo accounts sign in through Supabase (docs/deploy/SUPABASE.md, section 7).');
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

    // Supabase first: if a demo address belongs to someone else, this stops
    // before anything in the database changes.
    const identities = accounts ? await keepDemoAccounts(accounts, { people: DEMO_PEOPLE, password: DEMO_PASSWORD }) : null;
    if (identities) console.log(`\nKept ${identities.size} demo accounts in Supabase.`);

    await removeDemoData(DEMO_USER_IDS);
    console.log('\nRemoved the previous demo ward, if there was one.');

    const monday = anchor ?? currentMonday(WARD.timezone);
    // When the proposals are made: now - or, for a test's fixed week long
    // past, the start of that week, before any of its shifts.
    const now = anchor ? new Date(`${monday}T00:00:00Z`) : new Date();
    const ward = await writeWard({ anchor: monday, identities });
    const { rosters } = await writeRosters({ anchor: monday });
    const swaps = await writeSwapRequests({ anchor: monday });
    const proposals = await writeSwapProposals({ anchor: monday, now });

    printSummary({ ward, rosters, swaps, proposals });
    return 0;
  } catch (err) {
    console.log(`\nThe seed stopped: ${scrub(err?.message ?? err, uri)}`);
    console.log('Only demo data was being written. Run it again to start over; npm run db:check diagnoses connection problems.');
    return 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}
