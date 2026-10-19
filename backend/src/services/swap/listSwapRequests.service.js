// listSwapRequests.service.js
// The swap requests someone may see: a worker their own, a manager every
// request in the organisation - open ones, and matched ones (part of a
// proposed swap), each with its status, so My Shifts can say a shift is in
// a proposal rather than offer it again.
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
  const filter = { orgId, status: { $in: ['open', 'matched'] }, startsAt: { $gt: now } };
  if (!isManagerRole(membership.role)) filter.membershipId = membership._id;

  const requests = await SwapRequest.find(filter).sort({ startsAt: 1 }).lean();

  const onTeam = await Membership.find({ orgId, status: MEMBERSHIP_STATUS.ACTIVE }).select('_id').lean();
  const active = new Set(onTeam.map((m) => String(m._id)));

  return describeRequests(
    requests.filter((r) => active.has(String(r.membershipId))),
    membership,
  );
}
