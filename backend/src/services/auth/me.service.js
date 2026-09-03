// me.service.js
// Loads current user info along with their organisation memberships.

import { User, Membership, Organisation } from '../../models/index.js';
import { MEMBERSHIP_STATUS } from '../../config/constants.js';
import { AppError } from '../../errors/AppError.js';

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

  // Attach the org name to each membership so the frontend can render a
  // switcher without a second round trip.
  const enrichedMemberships = memberships.map((m) => ({
    orgId: m.orgId.toString(),
    orgName: orgMap[m.orgId.toString()]?.name || 'Unknown',
    role: m.role,
    qualificationIds: (m.qualificationIds ?? []).map((id) => id.toString()),
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
