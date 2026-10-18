// applyCycle.js
// The roster as it would look after a cycle - without touching the input.
//
// A cycle is a list of offers [o1, o2, ..., ok]. Read it as: o1's worker
// takes o2's shift, o2's worker takes o3's, ..., and ok's worker takes o1's.
// Everyone gives away exactly the shift they offered and receives exactly
// one. A direct swap is simply a cycle of two.

/** Each hand-over in the cycle: who gives which assignment to whom, in order. */
export function legsOf(cycle) {
  return cycle.map((taker, i) => {
    const offer = cycle[(i + 1) % cycle.length];
    return { offerId: offer.id, assignmentId: offer.assignmentId, from: offer.membershipId, to: taker.membershipId };
  });
}

/** A new array: every moved assignment re-held by its receiver, everything else as it was. */
export function applyCycle(assignments, cycle) {
  const newHolder = new Map(legsOf(cycle).map((leg) => [leg.assignmentId, leg.to]));

  return assignments.map((assignment) =>
    newHolder.has(assignment.id) ? { ...assignment, membershipId: newHolder.get(assignment.id) } : assignment,
  );
}

/**
 * The same cycle however it is rotated: the offer ids, starting from the
 * smallest. A->B->C and B->C->A give the same key; A->C->B, a different set
 * of hand-overs, does not.
 */
export function canonicalKey(cycle) {
  const ids = cycle.map((offer) => offer.id);
  const start = ids.indexOf([...ids].sort()[0]);
  return [...ids.slice(start), ...ids.slice(0, start)].join('>');
}
