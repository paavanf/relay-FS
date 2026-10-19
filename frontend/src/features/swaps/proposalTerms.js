// proposalTerms.js
// What proposing an option would mean for the person proposing it - for the
// confirmation before anything is sent:
//
//   givesAndTakes      the shift they would give, and the one they would take
//   proposalDeadline   when the proposal would end if not everyone accepted:
//                      the organisation's acceptance window from now, or the
//                      start of the swap's earliest shift if that is sooner.
//                      The server sets the real one; this is what to expect.

const HOUR_MS = 3_600_000;

/** { gives, takes } - shifts as the swap API returns them, or null if the person is not in it. */
export function givesAndTakes(option, membershipId) {
  const gives = option.legs.find((leg) => leg.from.membershipId === membershipId)?.assignment ?? null;
  const takes = option.legs.find((leg) => leg.to.membershipId === membershipId)?.assignment ?? null;
  return { gives, takes };
}

export function proposalDeadline(option, acceptanceWindowHours, now = Date.now()) {
  const earliest = Math.min(...option.legs.map((leg) => new Date(leg.assignment.startsAt).getTime()));
  return new Date(Math.min(now + acceptanceWindowHours * HOUR_MS, earliest));
}
