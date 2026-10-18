// handOverCheck.js
// The question the search asks at every step: can this person take that
// shift, with their own shift given away?
//
// It is asked through validateCycle's codesFor - the full check of that
// person's week after the hand-over, never a bare edge check - and each
// refusal is counted once, by the rules behind it, so the search can say
// what stood in the way.

export function createHandOverCheck({ codesFor, edgeSets, start }) {
  const refused = new Set();
  const blockedBy = {}; // rule code -> how many hand-overs it refused

  function canTake(taker, taken) {
    const codes = codesFor(taker, taken);
    if (codes.length === 0) return true;

    const key = `${taker.id}>${taken.id}`;
    if (!refused.has(key)) {
      refused.add(key);
      for (const code of codes) blockedBy[code] = (blockedBy[code] ?? 0) + 1;
    }
    return false;
  }

  /** Can `offer`'s person take the requester's shift? A path can only end with someone who can. */
  const closes = (offer) => edgeSets.get(offer.id)?.has(start.id) === true && canTake(offer, start);

  return { canTake, closes, blockedBy };
}
