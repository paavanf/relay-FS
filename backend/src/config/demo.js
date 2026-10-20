// demo.js
// How the server recognises the shared demo organisation and its accounts:
// by the fixed ids the demo seed gives them (scripts/demo/ids.js uses this
// file to build them).
//
// Every demo id is the four bytes 64 65 6d 6f ("demo" in ASCII), one byte
// for the kind of document, and a counter. No id MongoDB generates for this
// app can match: an ObjectId's first four bytes are the second it was made,
// and these four read as a second in May 2023.

import mongoose from 'mongoose';

const PREFIX = '64656d6f';

export const DEMO_KINDS = Object.freeze({
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
});

const kindHex = (kind) => DEMO_KINDS[kind].toString(16).padStart(2, '0');

/** demoId('user', 3) -> ObjectId('64656d6f0200000000000003') */
export function demoId(kind, n) {
  return new mongoose.Types.ObjectId(PREFIX + kindHex(kind) + n.toString(16).padStart(14, '0'));
}

export const DEMO_ORG_ID = demoId('org', 1);

/** Is this the shared demo organisation? */
export const isDemoOrg = (orgId) => Boolean(orgId) && String(orgId) === String(DEMO_ORG_ID);

/** Is this one of the demo seed's accounts? */
export const isDemoUser = (userId) => Boolean(userId) && String(userId).startsWith(PREFIX + kindHex('user'));

// What a locked part of the demo answers. The organisation's setup is locked
// (middleware/refuseInDemo.js); a demo account cannot create or join another
// organisation, which would follow it into every later visitor's session.
export const DEMO_LOCKED_MESSAGE = 'This is a shared demo, so this setting is locked. Create your own organisation to change it.';
export const DEMO_ACCOUNT_MESSAGE = 'This is a shared demo account, so it cannot create or join other organisations. Register your own account to do that.';
