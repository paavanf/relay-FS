// prepareData.js
// Run by the stack as a child process. Seeds the in-memory database with the
// demo ward - using the real seed script - then adds the suite's own
// fixtures, and prints one line, E2E_DATA {...}, with the ids the specs need.
//
// A child process rather than an import, so the backend's modules and their
// Mongoose connection never load into Playwright's own process.

import mongoose from 'mongoose';
import { main as seedDemo } from '../../backend/scripts/demo/runSeed.js';
import { addRosterWithHoles, addEmptyOrganisation, wardRosters } from './fixtures.js';
import { DEMO_ORG_ID } from '../../backend/scripts/demo/ids.js';

const uri = process.env.MONGODB_URI ?? '';

// Belt and braces: the stack only ever hands this script the address of the
// in-memory server it started on this machine. Anything else is refused.
if (!/^mongodb:\/\/127\.0\.0\.1:\d+\/[\w-]+-demo\?/.test(uri)) {
  console.error('prepareData: refusing to write to anything but the local in-memory server.');
  process.exit(1);
}

const code = await seedDemo(['--yes'], { MONGODB_URI: uri });
if (code !== 0) process.exit(code);

await mongoose.connect(uri);
try {
  const holes = await addRosterWithHoles();
  const empty = await addEmptyOrganisation();
  const rosters = await wardRosters();
  console.log(`E2E_DATA ${JSON.stringify({ orgId: String(DEMO_ORG_ID), rosters, ...holes, ...empty })}`);
} finally {
  await mongoose.disconnect();
}
