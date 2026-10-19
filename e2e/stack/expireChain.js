// expireChain.js
// Run as a child process by support/database.js: puts one proposed swap's
// deadline a minute in the past, in the in-memory test database, so the
// expiry path can be checked without waiting days for it - exactly what
// the clock would do, and nothing more. The app then expires it the next
// time anyone looks, as it would in real life. Prints E2E_EXPIRED <count>.
//
// A child process, like prepareData.js, so the backend's models and their
// Mongoose connection never load into Playwright's own process.

import mongoose from 'mongoose';
import { SwapChain } from '../../backend/src/models/index.js';

const uri = process.env.MONGODB_URI ?? '';
const chainId = process.argv[2];

// Only ever the local in-memory server the stack started, and one chain.
if (!/^mongodb:\/\/127\.0\.0\.1:\d+\/[\w-]+-demo\?/.test(uri) || !/^[0-9a-f]{24}$/.test(chainId ?? '')) {
  console.error('expireChain: refusing - pass a chain id, with the local in-memory server as MONGODB_URI.');
  process.exit(1);
}

await mongoose.connect(uri);
try {
  const past = new Date(Date.now() - 60_000);
  const result = await SwapChain.updateOne({ _id: chainId }, { $set: { expiresAt: past } });
  console.log(`E2E_EXPIRED ${result.modifiedCount}`);
} finally {
  await mongoose.disconnect();
}
