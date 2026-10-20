// me.service.js
// Loads current user info along with their organisation memberships.

import { User, Membership, Organisation } from '../../models/index.js';
import { MEMBERSHIP_STATUS } from '../../config/constants.js';
import { AppError } from '../../errors/AppError.js';
import { isDemoOrg } from '../../config/demo.js';

export async function getCurrentUser(userId) {
  const user = await User.findById(userId).select('-passwordHash').lean();
  if (!user) throw AppError.unauthorized('User not found');

  const memberships = await Membership.find({
    userId,
    status: MEMBERSHIP_STATUS.ACTIVE,
  }).lean();

  // One query for every organisation involved, rather than one per membership.
  const orgIds = memberships.map((m) => m.orgId);
  const orgs = await Organisation.find({ _id: { $in: orgIds } })
    .select('name timezone')
    .lean();

  const orgMap = {};
  orgs.forEach((o) => {
    orgMap[o._id.toString()] = o;
  });

  // Attach the org name and timezone to each membership so the frontend can
  // render a switcher, and show shift times in the organisation's zone rather
  // than the browser's, without a second round trip. isDemo marks the shared
  // demo organisation, whose locked setup the frontend shows as locked - the
  // server refuses it either way.
  const enrichedMemberships = memberships.map((m) => ({
    orgId: m.orgId.toString(),
    orgName: orgMap[m.orgId.toString()]?.name || 'Unknown',
    orgTimezone: orgMap[m.orgId.toString()]?.timezone || 'UTC',
    role: m.role,
    qualificationIds: (m.qualificationIds ?? []).map((id) => id.toString()),
    isDemo: isDemoOrg(m.orgId),
  }));

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    memberships: enrichedMemberships,
  };
}
