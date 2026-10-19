// chainNotices.js
// The notifications a change to a swap chain writes: who hears about it,
// and the one plain sentence they read. Data only - the Swaps page lists
// them until the notification centre arrives (Milestone 9).
//
//   others     everyone in the chain except whoever just acted
//   everyone   everyone in the chain
//   managers   the organisation's managers and owners
//
// Some sentences are personal - "you would give your night shift on ..." -
// so each person's is written for them.

const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

/** "night shift on Tuesday 17 March" */
export const shiftWords = (shift) =>
  shift ? `${(shift.shift?.name ?? 'Shift').toLowerCase()} shift on ${longDate.format(new Date(`${shift.date}T00:00:00Z`))}` : 'shift';

const withoutFullStop = (text) => text.replace(/[.\s]+$/, '');

const NOTICES = {
  proposed: [['others', (c) => `${c.actor} proposed a swap: you would give your ${c.gives} and take the ${c.receives}. Accept or decline it on the Swaps page.`]],
  accepted: [['others', (c) => `${c.actor} accepted the swap.`]],
  awaiting_approval: [
    ['everyone', () => 'Everyone has accepted the swap. It is now waiting for a manager to approve it.'],
    ['managers', (c) => `A swap between ${c.people} is waiting for your approval.`],
  ],
  declined: [['others', (c) => `${c.actor} declined the swap, so it is off. Your offer is open again.`]],
  cancelled: [['others', (c) => `${c.actor} cancelled the swap proposal. Your offer is open again.`]],
  rejected: [['everyone', (c) => `A manager rejected the swap${c.reason ? `: ${withoutFullStop(c.reason)}` : ''}. Your offer is open again.`]],
  expired: [['everyone', () => 'The swap proposal ran out of time before it was completed. Nothing has changed.']],
  approved: [['everyone', (c) => `${c.actor} approved the swap.`]],
  committed: [['everyone', (c) => `The swap is done: you now work the ${c.receives} instead of your ${c.gives}.`]],
  failed: [['everyone', (c) => `The swap could not be completed: ${c.reason} Nothing has changed, and your offer is open again.`]],
};

const KINDS = Object.keys(NOTICES);

function audience(to, { chain, actorId, managerIds }) {
  const people = chain.legs.map((leg) => String(leg.membershipId));
  if (to === 'managers') return managerIds;
  return to === 'others' ? people.filter((id) => id !== String(actorId)) : people;
}

/**
 * The notifications for one kind of change, ready to insert.
 * facts: { chain, actorId, names (Map), shifts (Map assignmentId -> shift), managerIds, reason }
 */
export function noticesFor(kind, facts) {
  if (!KINDS.includes(kind)) return [];
  const { chain, actorId, names, shifts } = facts;
  const legOf = new Map(chain.legs.map((leg) => [String(leg.membershipId), leg]));
  const people = chain.legs.map((leg) => names.get(String(leg.membershipId)) ?? 'a team member');

  return NOTICES[kind].flatMap(([to, say]) =>
    audience(to, facts).map((membershipId) => {
      const leg = legOf.get(membershipId);
      const message = say({
        actor: names.get(String(actorId)) ?? 'Someone',
        people: `${people.slice(0, -1).join(', ')} and ${people.at(-1)}`,
        gives: leg ? shiftWords(shifts.get(String(leg.givesAssignmentId))) : '',
        receives: leg ? shiftWords(shifts.get(String(leg.receivesAssignmentId))) : '',
        reason: facts.reason,
      });
      return { orgId: chain.orgId, membershipId, type: `swap_${kind}`, chainId: chain._id, message };
    }),
  );
}
