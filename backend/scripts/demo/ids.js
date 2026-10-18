// ids.js
// Fixed ids for everything the demo seed creates.
//
// Every id is built the same way: the four bytes 64 65 6d 6f ("demo" in
// ASCII), one byte saying what kind of document it is, and a counter. So the
// same run always produces the same ids - a bookmarked link into the demo
// ward still works after a reseed - and the reset can name exactly the
// documents it made.
//
// The organisation's id is the marker the reset looks for. Everything the
// demo owns hangs off it, and nothing else in the database carries it.

import mongoose from 'mongoose';

const PREFIX = '64656d6f';

const KINDS = {
  org: 1,
  user: 2,
  membership: 3,
  qualification: 4,
  template: 5,
  coverage: 6,
  availability: 7,
  roster: 8,
  assignment: 9,
  swapRequest: 10,
};

/** demoId('user', 3) -> ObjectId('64656d6f0200000000000003') */
export function demoId(kind, n) {
  const kindHex = KINDS[kind].toString(16).padStart(2, '0');
  return new mongoose.Types.ObjectId(PREFIX + kindHex + n.toString(16).padStart(14, '0'));
}

export const DEMO_ORG_ID = demoId('org', 1);
