// swapNotices.js
// Who hears about each thing that happens to a swap chain, and what they
// read. Some sentences are personal - "you would give your night shift..."
// - so each person's is written for them. Nobody is told about their own
// action: the person who proposes, cancels or rejects is not notified of it.
//
//   proposed            everyone in it except the proposer       (emailed)
//   accepted, declined  the proposer
//   awaiting_approval   the organisation's managers and owners   (emailed)
//   committed, failed, expired   everyone in it
//   cancelled, rejected          everyone in it but whoever did it

import { Membership } from '../../models/index.js';
import { MANAGER_ROLES, MEMBERSHIP_STATUS } from '../../config/constants.js';
import { namesOf } from '../member/memberNames.js';
import { shiftsById } from '../swap/describeShifts.js';
import { shiftWords, listWords, withoutFullStop } from './noticeWords.js';

const EVENTS = {
  swap_proposed: {
    to: 'others',
    say: (w) => `${w.actor} proposed a swap: you would give your ${w.gives} and take the ${w.takes}. Accept or decline it on the Swaps page.`,
    email: (w) => ({ subject: `${w.actor} proposed a shift swap to you`, label: 'See the proposal' }),
  },
  swap_accepted: { to: 'proposer', say: (w) => `${w.actor} accepted your swap proposal.` },
  swap_declined: { to: 'proposer', say: (w) => `${w.actor} declined your swap proposal, so it is off. Your offer is open again.` },
  swap_awaiting_approval: {
    to: 'managers',
    page: 'swaps/approvals',
    say: (w) => `A swap between ${w.people} is waiting for your approval.`,
    email: () => ({ subject: 'A shift swap is waiting for your approval', label: 'Review the swap' }),
  },
  swap_committed: {
    to: 'everyone',
    say: (w) => `${w.approver ? `${w.approver} approved the swap, and it is done` : 'The swap is done'}: you now work the ${w.takes} instead of your ${w.gives}.`,
  },
  swap_failed: { to: 'everyone', say: (w) => `The swap could not be completed: ${w.reason} Nothing has changed, and your offer is open again.` },
  swap_expired: { to: 'everyone', say: () => 'The swap proposal ran out of time before it was completed. Nothing has changed.' },
  swap_cancelled: { to: 'others', say: (w) => `${w.actor} cancelled the swap proposal. Your offer is open again.` },
  swap_rejected: {
    to: 'others',
    say: (w) => `A manager rejected the swap${w.reason ? `: ${withoutFullStop(w.reason)}` : ''}. Your offer is open again.`,
  },
};

async function audience(to, chain, actor) {
  const people = chain.legs.map((leg) => String(leg.membershipId));
  if (to === 'everyone') return people;
  if (to === 'others') return people.filter((id) => id !== actor);
  if (to === 'proposer') return [String(chain.proposerId)].filter((id) => id !== actor);
  const managers = await Membership.find({ orgId: chain.orgId, role: { $in: MANAGER_ROLES }, status: MEMBERSHIP_STATUS.ACTIVE }).select('_id').lean();
  return managers.map((m) => String(m._id)).filter((id) => id !== actor);
}

/** The notices for one event about a stored chain; actorId is whoever caused it (null for an expiry). */
export async function swapNotices(event, { chain, actorId = null }) {
  const spec = EVENTS[event];
  const actor = actorId ? String(actorId) : null;
  const approverId = chain.endedBy?.action === 'approve' ? chain.endedBy.membershipId : null;
  const [recipients, names, shifts] = await Promise.all([
    audience(spec.to, chain, actor),
    namesOf([...chain.legs.map((leg) => leg.membershipId), actorId, approverId].filter(Boolean)),
    shiftsById(chain.legs.map((leg) => leg.givesAssignmentId)),
  ]);
  const legOf = new Map(chain.legs.map((leg) => [String(leg.membershipId), leg]));
  const link = `/app/${chain.orgId}/${spec.page ?? 'swaps'}?chain=${chain._id}`;

  return recipients.map((membershipId) => {
    const leg = legOf.get(membershipId);
    const words = {
      actor: names.get(actor) ?? 'Someone',
      approver: approverId ? names.get(String(approverId)) : null,
      people: listWords(chain.legs.map((l) => names.get(String(l.membershipId)) ?? 'a team member')),
      gives: leg ? shiftWords(shifts.get(String(leg.givesAssignmentId))) : '',
      takes: leg ? shiftWords(shifts.get(String(leg.receivesAssignmentId))) : '',
      reason: chain.failureReason ?? chain.rejectionReason ?? null,
    };
    // Each person's acceptance is its own event; everything else happens to a chain once.
    const byWhom = event === 'swap_accepted' ? `${actor}:` : '';
    return {
      orgId: chain.orgId,
      membershipId,
      type: event,
      message: spec.say(words),
      link,
      chainId: chain._id,
      dedupeKey: `${event}:${chain._id}:${byWhom}${membershipId}`,
      email: spec.email?.(words) ?? null,
    };
  });
}
