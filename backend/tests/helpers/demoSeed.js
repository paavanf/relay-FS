// demoSeed.js
// Runs the demo seed against the in-memory server and reads back what it
// wrote. Shared by the seed's two test files; nothing here can reach a real
// database, because every address comes from the in-memory server.
//
// The seed opens its own connection from MONGODB_URI, so these helpers hand
// it an environment naming a database on the in-memory server, then read the
// result over a connection of their own.

import mongoose from 'mongoose';
import { testServerUri } from './db.js';
import { main } from '../../scripts/demo/runSeed.js';
import { User, Organisation, Membership, Qualification, ShiftTemplate } from '../../src/models/index.js';
import { CoverageRequirement, Availability, Roster, Assignment, FairnessLedger, SwapRequest } from '../../src/models/index.js';

export const DEMO_ANCHOR = '2026-03-02'; // a Monday

/**
 * Runs the seed with these arguments against one database of the in-memory
 * server - leaving Supabase out: test sign-ins link to the demo by email.
 */
export function seed(argv, database = 'relay-demo') {
  return main(argv, { MONGODB_URI: testServerUri(database) }, { anchor: DEMO_ANCHOR, accounts: false });
}

/**
 * Runs read() over a connection of the test's own, then closes it. That
 * connection never builds indexes or creates collections, so "no
 * collections" really does mean the seed wrote nothing.
 */
export async function inDatabase(database, read) {
  await mongoose.connect(testServerUri(database), { autoIndex: false, autoCreate: false });
  try {
    return await read();
  } finally {
    await mongoose.disconnect();
  }
}

export function collectionsIn(database) {
  return inDatabase(database, () => mongoose.connection.db.listCollections().toArray());
}

/** Everything the seed writes, in a form two runs can be compared by. */
export function snapshot() {
  return inDatabase('relay-demo', async () => ({
    users: await User.countDocuments(),
    organisations: await Organisation.countDocuments(),
    memberships: await Membership.countDocuments(),
    qualifications: await Qualification.countDocuments(),
    templates: await ShiftTemplate.countDocuments(),
    coverage: await CoverageRequirement.countDocuments(),
    availability: (await Availability.find().sort({ _id: 1 }).lean()).map((a) => `${a._id} ${a.status}`),
    rosters: (await Roster.find().sort({ startDate: 1 }).lean()).map((r) => `${r.startDate} ${r.endDate} ${r.status}`),
    assignments: (await Assignment.find().sort({ _id: 1 }).lean()).map((a) => `${a._id} ${a.membershipId} ${a.date}`),
    measured: await FairnessLedger.countDocuments({ measured: true }),
    swapRequests: (await SwapRequest.find().sort({ _id: 1 }).lean()).map((r) => `${r._id} ${r.membershipId} ${r.assignmentId} ${r.status}`),
  }));
}
