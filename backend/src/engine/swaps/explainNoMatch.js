// explainNoMatch.js
// When the search finds nothing, says why - in words a worker can act on,
// the way unfilled shifts explain themselves. An empty list with no reason
// is a dead end; "3 need a qualification you don't hold" is not.
//
// Every other person's offer is put down to one thing that rules it out,
// looking at both sides of the swap:
//   your side   could you take their shift, giving yours away?
//   their side  could they take yours, giving theirs away?
// Reasons are weighed in tiers, and within a tier your side is named first.
// A missing qualification or role comes before anything else, then a day
// someone declared unavailable - facts about a person that no other swap
// could change - then what someone said they would take in return, and only
// then the timing rules, which depend on which shifts move. So a charge
// nurse's shift that no one else offering could hold is explained as exactly
// that, even when the charge nurse's own week is full too.
//
// A pair that clears both sides is a valid direct swap and would have been
// found, so in a real "no options" result every offer lands somewhere below.
// Longer chains run through the same people and stall on the same reasons.

const TIERS = [['QUALIFICATION_MISMATCH'], ['DECLARED_UNAVAILABLE'], ['FILTER_MISMATCH'], ['DOUBLE_BOOKED', 'MIN_REST', 'MAX_CONSECUTIVE_DAYS', 'MAX_WEEKLY_HOURS']];

// [one, many] - "1 needs ...", "3 need ...".
const YOUR_SIDE = {
  QUALIFICATION_MISMATCH: ["needs a qualification you don't hold", "need a qualification you don't hold"],
  DECLARED_UNAVAILABLE: ['is on a day you marked unavailable', 'are on days you marked unavailable'],
  FILTER_MISMATCH: ["didn't match what you said you'd take", "didn't match what you said you'd take"],
  DOUBLE_BOOKED: ['overlaps a shift you already have', 'overlap shifts you already have'],
  MIN_REST: ['would break minimum rest', 'would break minimum rest'],
  MAX_CONSECUTIVE_DAYS: ['would give you too many days in a row', 'would give you too many days in a row'],
  MAX_WEEKLY_HOURS: ['would take you over the weekly hours limit', 'would take you over the weekly hours limit'],
};
const THEIR_SIDE = {
  QUALIFICATION_MISMATCH: ['is from someone without the qualification your shift needs', 'are from people without the qualification your shift needs'],
  DECLARED_UNAVAILABLE: ['is from someone unavailable when your shift is', 'are from people unavailable when your shift is'],
  FILTER_MISMATCH: ["is from someone who said they wouldn't take a shift like yours", "are from people who said they wouldn't take a shift like yours"],
  OTHER: ["is from someone who can't fit your shift in", "are from people who can't fit your shift in"],
};

function causeFor(request, other, { blocked, codesFor }) {
  const sides = [
    ['you', blocked.get(`${request.id}|${other.id}`) ?? codesFor(request, other)],
    ['them', blocked.get(`${other.id}|${request.id}`) ?? codesFor(other, request)],
  ];
  for (const tier of TIERS) {
    for (const code of tier) {
      for (const [side, codes] of sides) if (codes.includes(code)) return { side, code };
    }
  }
  // Something the tiers do not list, on either side.
  for (const [side, codes] of sides) if (codes.length > 0) return { side, code: codes[0] };

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
