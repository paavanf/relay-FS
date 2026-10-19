// memberNotices.js
// Someone accepted an invite and joined: the organisation's managers and
// owners hear about it, with a link to the Team page - where their
// qualifications and hours are set before the next roster is generated.
// Not emailed: nothing about it expires.

import { Membership } from '../../models/index.js';
import { MANAGER_ROLES, MEMBERSHIP_STATUS } from '../../config/constants.js';

/** membership: the new (or returning) member; name: theirs. */
export async function memberNotices(event, { membership, name }) {
  const managers = await Membership.find({ orgId: membership.orgId, role: { $in: MANAGER_ROLES }, status: MEMBERSHIP_STATUS.ACTIVE })
    .select('_id')
    .lean();
  const joined = new Date(membership.joinedAt ?? Date.now()).getTime();

  return managers
    .map((m) => String(m._id))
    .filter((id) => id !== String(membership._id))
    .map((membershipId) => ({
      orgId: membership.orgId,
      membershipId,
      type: event,
      message: `${name} accepted an invite and joined the team.`,
      link: `/app/${membership.orgId}/team`,
      aboutMembershipId: membership._id,
      // Joined at a moment: someone who leaves and is invited back is news again.
      dedupeKey: `${event}:${membership._id}:${joined}:${membershipId}`,
      email: null,
    }));
}
