// explainNoMatch.js
// When the search finds nothing, says why - in words a worker can act on,
// the way unfilled shifts explain themselves. An empty list with no reason
// is a dead end; "3 need a qualification you don't hold" is not.
//
// Every other person's offer is put down to the first thing that rules it
// out, checked from your side first and then from theirs:
//   your side   could you take their shift, giving yours away?
//   their side  could they take yours, giving theirs away?
// A pair that clears both is a valid direct swap and would have been found,
// so in a real "no options" result every offer lands somewhere below. Longer
// chains run through the same people and stall on the same reasons.

const ORDER = ['QUALIFICATION_MISMATCH', 'DECLARED_UNAVAILABLE', 'DOUBLE_BOOKED', 'MIN_REST', 'MAX_CONSECUTIVE_DAYS', 'MAX_WEEKLY_HOURS'];

// [one, many] - "1 needs ...", "3 need ...".
const YOUR_SIDE = {
  QUALIFICATION_MISMATCH: ["needs a qualification you don't hold", "need a qualification you don't hold"],
  DECLARED_UNAVAILABLE: ['is on a day you marked unavailable', 'are on days you marked unavailable'],
  DOUBLE_BOOKED: ['overlaps a shift you already have', 'overlap shifts you already have'],
  MIN_REST: ['would break minimum rest', 'would break minimum rest'],
  MAX_CONSECUTIVE_DAYS: ['would give you too many days in a row', 'would give you too many days in a row'],
  MAX_WEEKLY_HOURS: ['would take you over the weekly hours limit', 'would take you over the weekly hours limit'],
};
const THEIR_SIDE = {
  QUALIFICATION_MISMATCH: ['is from someone without the qualification your shift needs', 'are from people without the qualification your shift needs'],
  DECLARED_UNAVAILABLE: ['is from someone unavailable when your shift is', 'are from people unavailable when your shift is'],
  OTHER: ["is from someone who can't fit your shift in", "are from people who can't fit your shift in"],
};

const firstOf = (codes) => ORDER.find((code) => codes.includes(code)) ?? codes[0];

function causeFor(request, other, { blocked, codesFor }) {
  const yours = blocked.get(`${request.id}|${other.id}`) ?? codesFor(request, other);
  if (yours.length > 0) return { side: 'you', code: firstOf(yours) };

  const theirs = blocked.get(`${other.id}|${request.id}`) ?? codesFor(other, request);
  if (theirs.length > 0) return { side: 'them', code: firstOf(theirs) };

  // Clears both sides, yet no option came back: the search was cut short.
  return { side: 'search', code: 'NOT_REACHED' };
}

function phrase({ side, code, count }) {
  const words =
    side === 'you' ? YOUR_SIDE[code] : side === 'them' ? THEIR_SIDE[code] ?? THEIR_SIDE.OTHER : ['was not reached before the search stopped', 'were not reached before the search stopped'];
  return `${count} ${(words ?? ['is ruled out', 'are ruled out'])[count === 1 ? 0 : 1]}`;
}

/** @returns {{ offersChecked: number, reasons: Array<{ side, code, count }>, summary: string }} */
export function explainNoMatch({ request, offers, blocked, codesFor, truncated }) {
  const others = offers.filter((offer) => offer.membershipId !== request.membershipId);
  if (others.length === 0) {
    return { offersChecked: 0, reasons: [], summary: 'Nobody else has offered a shift yet, so there is nothing to swap with.' };
  }

  const counts = new Map();
  for (const other of others) {
    const { side, code } = causeFor(request, other, { blocked, codesFor });
    const key = `${side}|${code}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const reasons = [...counts]
    .map(([key, count]) => ({ side: key.split('|')[0], code: key.split('|')[1], count }))
    .sort((a, b) => b.count - a.count || (a.side + a.code < b.side + b.code ? -1 : 1));

  const n = others.length;
  const stopped = truncated ? ' The search stopped early, so not every longer chain was checked.' : '';
  return { offersChecked: n, reasons, summary: `${n} ${n === 1 ? 'offer' : 'offers'} checked: ${reasons.map(phrase).join(', ')}.${stopped}` };
}
