// reset.js
// Removes what an earlier run of the seed created - and only that.
//
// Everything that belongs to an organisation is found by the demo
// organisation's fixed id (ids.js), and the people by their fixed user ids.
// Nothing here matches on a name, an email pattern or anything else that
// someone else's data could share.
//
// That includes things made while trying the demo out: an invite sent from
// the demo ward, or a real account's membership of it, belong to the demo
// organisation and go with it. The real account itself is left alone.

import {
  Organisation,
  Membership,
  Invite,
  Qualification,
  ShiftTemplate,
  CoverageRequirement,
  Availability,
  Roster,
  Assignment,
  GenerationJob,
  FairnessLedger,
  User,
  RefreshToken,
  PasswordResetToken,
} from '../../src/models/index.js';
import { DEMO_ORG_ID } from './ids.js';

// Every model with an orgId. A collection added later and left off this list
// would keep its demo rows after a reseed - so add it here.
const ORG_SCOPED = [
  Membership,
  Invite,
  Qualification,
  ShiftTemplate,
  CoverageRequirement,
  Availability,
  Roster,
  Assignment,
  GenerationJob,
  FairnessLedger,
];

export async function removeDemoData(userIds) {
  for (const Model of ORG_SCOPED) {
    await Model.deleteMany({ orgId: DEMO_ORG_ID });
  }
  await Organisation.deleteOne({ _id: DEMO_ORG_ID });

  // The demo people's sessions and reset links go with their accounts.
  await RefreshToken.deleteMany({ userId: { $in: userIds } });
  await PasswordResetToken.deleteMany({ userId: { $in: userIds } });
  await User.deleteMany({ _id: { $in: userIds } });
}

/**
 * Demo emails already held by accounts this seed did not create - someone
 * registered owner@relay.test by hand, say. Those accounts are not the
 * seed's to delete, so it stops instead.
 */
export async function emailsTakenByOthers(emails, userIds) {
  const users = await User.find({ email: { $in: emails }, _id: { $nin: userIds } })
    .select('email')
    .lean();
  return users.map((user) => user.email);
}
