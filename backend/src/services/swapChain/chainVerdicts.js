// chainVerdicts.js
// The constraint engine's verdict on a chain as if it happened now, person
// by person: the commit's last check, and the rule check on the approval
// page. It loads what the engine needs and asks engine/swaps/cycleVerdicts -
// no rule of its own.
//
// Inside the commit, the session makes the shifts it reads the same ones
// the commit is about to move.

import { Organisation, Assignment } from '../../models/index.js';
import { cycleVerdicts } from '../../engine/index.js';
import { loadOrgSchedulingData, toEngineContext } from '../roster/orgSchedulingData.service.js';
import { toEngineAssignment } from '../roster/toEngineAssignment.js';
import { publishedAround } from '../swap/publishedAround.js';

/** In chain order, as the engine's cycles are: each person takes the next one's shift. */
export const cycleOf = (chain) =>
  chain.legs.map((leg) => ({
    id: String(leg.swapRequestId),
    membershipId: String(leg.membershipId),
    assignmentId: String(leg.givesAssignmentId),
  }));

/** @returns {Promise<{ membershipId, hardViolations: { code, message }[] }[]>} */
export async function chainVerdicts({ chain, session }) {
  const org = await Organisation.findById(chain.orgId).lean();
  const data = await loadOrgSchedulingData(org);

  const moved = Assignment.find({ _id: { $in: chain.legs.map((leg) => leg.givesAssignmentId) } }).lean();
  if (session) moved.session(session);
  const people = chain.legs.map((leg) => leg.membershipId);
  const around = await publishedAround(chain.orgId, await moved, { membershipIds: people, session });

  return cycleVerdicts({ assignments: around.map(toEngineAssignment), context: toEngineContext(data), cycle: cycleOf(chain) });
}
