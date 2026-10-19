// buildGraph.js
// The candidate graph for one search. An edge X -> Y means X's worker might
// take Y's offered shift.
//
// A PRE-FILTER ONLY. It asks the M3 engine about the moved shift on its own,
// which leaves exactly the rules that cannot change with anything else in a
// swap: the role the shift fills (or, for a legacy record, a qualification
// its shift calls for), and a day or shift the taker declared unavailable.
// It also asks whether the taker is willing: the shift has to match what
// their own offer said they would take in return (acceptsShift.js).
//
// Everything that depends on the rest of a person's schedule - rest,
// overlaps, consecutive days, weekly hours - is left to validateCycle,
// because what someone gives away in the same cycle can make an edge legal
// that looks illegal here, and the other way round. So an edge here is a
// candidate, never a guarantee.

import { evaluate } from '../constraints/evaluate.js';
import { createOwnContext } from './ownContext.js';
import { acceptsShift } from './acceptsShift.js';

/** The offered shift as it would be if `membershipId` held it. */
export function movedTo(assignment, membershipId) {
  return { ...assignment, membershipId };
}

/**
 * @param {Array<{ id, membershipId, assignmentId, filters? }>} offers  sorted by id
 * @returns {{ edges: Map<string, string[]>, edgeSets: Map<string, Set<string>>,
 *             blocked: Map<string, string[]>, count: number }}
 *   blocked: "takerOfferId|offerId" -> the codes that ruled the edge out
 */
export function buildGraph({ offers, assignmentsById, context }) {
  const edges = new Map(offers.map((offer) => [offer.id, []]));
  const blocked = new Map();
  const ownContext = createOwnContext(context);
  let count = 0;

  for (const taker of offers) {
    for (const offer of offers) {
      // Nobody swaps with themselves, including a second shift they offered.
      if (taker.membershipId === offer.membershipId) continue;

      const shift = assignmentsById.get(offer.assignmentId);
      const { hardViolations } = evaluate([movedTo(shift, taker.membershipId)], ownContext(taker.membershipId), { skipSoft: true });
      const codes = hardViolations.map((v) => v.code);
      if (!acceptsShift(taker.filters, shift, context)) codes.push('FILTER_MISMATCH');

      if (codes.length === 0) {
        edges.get(taker.id).push(offer.id);
        count += 1;
      } else {
        blocked.set(`${taker.id}|${offer.id}`, codes);
      }
    }
  }

  const edgeSets = new Map([...edges].map(([id, targets]) => [id, new Set(targets)]));
  return { edges, edgeSets, blocked, count };
}
