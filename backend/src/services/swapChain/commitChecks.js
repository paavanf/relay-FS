// commitChecks.js
// The checks a commit makes, inside its transaction, before any shift moves
// - steps 2 to 4 of commitChain.service.js:
//
//   2. every shift is the very version the chain was proposed with, and is
//      still reserved by this chain
//   3. everyone in it is still an active member of the team
//   4. the constraint engine finds no hard rule broken in anyone's week
//      after the swap
//
// Returns the first problem as a plain sentence for the people in the swap,
// or null when the commit may go ahead.

import { Assignment, Membership } from '../../models/index.js';
import { MEMBERSHIP_STATUS } from '../../config/constants.js';
import { namesOf } from '../member/memberNames.js';
import { chainVerdicts } from './chainVerdicts.js';

async function shiftProblem(chain, session) {
  const shifts = await Assignment.find({ _id: { $in: chain.legs.map((leg) => leg.givesAssignmentId) } })
    .session(session)
    .lean();
  const byId = new Map(shifts.map((shift) => [String(shift._id), shift]));

  for (const leg of chain.legs) {
    const shift = byId.get(String(leg.givesAssignmentId));
    if (!shift) return 'one of its shifts is no longer on the roster.';
    if ((shift.version ?? 0) !== leg.givesVersion) return 'one of its shifts has changed since the swap was proposed.';
    if (String(shift.reservedByChainId) !== String(chain._id)) return 'one of its shifts is no longer held for this swap.';
  }
  return null;
}

async function memberProblem(chain, session) {
  const people = chain.legs.map((leg) => String(leg.membershipId));
  const active = await Membership.find({ _id: { $in: people }, orgId: chain.orgId, status: MEMBERSHIP_STATUS.ACTIVE })
    .session(session)
    .select('_id')
    .lean();
  const stillHere = new Set(active.map((m) => String(m._id)));
  const gone = people.find((id) => !stillHere.has(id));
  if (!gone) return null;

  const names = await namesOf([gone]);
  return `${names.get(gone)} is no longer on the team.`;
}

async function ruleProblem(chain, session) {
  const broken = (await chainVerdicts({ chain, session })).find((verdict) => verdict.hardViolations.length > 0);
  if (!broken) return null;

  const names = await namesOf([broken.membershipId]);
  const rule = broken.hardViolations[0].message.replace(/[.\s]+$/, '');
  return `${names.get(broken.membershipId)} would break a scheduling rule after the swap (${rule}).`;
}

export async function findCommitProblem({ chain, session }) {
  return (await shiftProblem(chain, session)) ?? (await memberProblem(chain, session)) ?? (await ruleProblem(chain, session));
}
