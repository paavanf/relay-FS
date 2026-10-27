// deleteIdentity.service.js
// What happens when a Supabase user is deleted - the webhook's DELETE.
//
// The Relay account stays: its shifts, swaps and audit entries are history
// other people rely on. But the person leaves every organisation:
//   - identityDeletedAt is set, so their old tokens are refused at once
//   - each active membership is deactivated exactly as a manager would do it
//     (member/deactivateMembership.js): draft shifts become unfilled slots,
//     published rosters keep them
//   - except where they are the last active owner. An organisation must
//     always keep an owner, so that membership stays, and it is logged. If
//     they sign up again with the same email, they get this account back.
//
// Safe to run twice: the second time finds nothing left to do. Even if a
// first run stopped halfway, the second finishes the job.

import { User, Membership } from '../../models/index.js';
import { MEMBERSHIP_STATUS } from '../../config/constants.js';
import { deactivateMembership } from '../member/deactivateMembership.js';
import { logger } from '../../utils/logger.js';

const isLastOwnerRefusal = (error) => error?.statusCode === 409;

export async function deleteIdentity(externalId) {
  const user = await User.findOne({ supabaseUserId: externalId });
  if (!user) return { deactivated: 0, keptAsLastOwner: 0 };

  if (!user.identityDeletedAt) await User.updateOne({ _id: user._id }, { $set: { identityDeletedAt: new Date() } });

  const memberships = await Membership.find({ userId: user._id, status: MEMBERSHIP_STATUS.ACTIVE }).lean();
  const result = { deactivated: 0, keptAsLastOwner: 0 };

  for (const member of memberships) {
    try {
      await deactivateMembership(member);
      result.deactivated += 1;
    } catch (error) {
      if (!isLastOwnerRefusal(error)) throw error;
      result.keptAsLastOwner += 1;
      logger.warn({ orgId: String(member.orgId) }, 'Deleted sign-in kept as the last owner of an organisation');
    }
  }
  return result;
}
