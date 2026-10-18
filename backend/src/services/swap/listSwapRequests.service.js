// listSwapRequests.service.js
// The swap requests someone may see: a worker their own, a manager every
// open request in the organisation.
//
// Only requests whose shift has not started. Expiry is derived at read time
// - a request whose shift has begun is expired - so there is no timer to
// forget and nothing to sweep. Requests from someone no longer on the team
// are left out too: they cannot hand anything over now.

import { SwapRequest, Membership } from '../../models/index.js';
import { MEMBERSHIP_STATUS } from '../../config/constants.js';
import { isManagerRole } from '../../utils/roles.js';
import { describeRequests } from './swapRequestDto.js';

export async function listSwapRequests({ orgId, membership, now = new Date() }) {
  const filter = { orgId, status: 'open', startsAt: { $gt: now } };
  if (!isManagerRole(membership.role)) filter.membershipId = membership._id;

  const requests = await SwapRequest.find(filter).sort({ startsAt: 1 }).lean();

  const onTeam = await Membership.find({ orgId, status: MEMBERSHIP_STATUS.ACTIVE }).select('_id').lean();
  const active = new Set(onTeam.map((m) => String(m._id)));

  return describeRequests(
    requests.filter((r) => active.has(String(r.membershipId))),
    membership,
  );
}
