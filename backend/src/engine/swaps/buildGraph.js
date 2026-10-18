// buildGraph.js
// The candidate graph for one search. An edge X -> Y means X's worker might
// take Y's offered shift.
//
// A PRE-FILTER ONLY. It asks the M3 engine about the moved shift on its own,
// which leaves exactly the rules that cannot change with anything else in a
// swap: the qualification the shift calls for, and a day or shift the taker
// declared unavailable. Everything that depends on the rest of a person's
// schedule - rest, overlaps, consecutive days, weekly hours - is left to
// validateCycle, because what someone gives away in the same cycle can make
// an edge legal that looks illegal here, and the other way round.
//
// So an edge here is a candidate, never a guarantee.

import { evaluate } from '../constraints/evaluate.js';
import { createOwnContext } from './ownContext.js';

/** The offered shift as it would be if `membershipId` held it. */
export function movedTo(assignment, membershipId) {
  return { ...assignment, membershipId };
}

/**
 * @param {Array<{ id, membershipId, assignmentId }>} offers  sorted by id
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

      const moved = movedTo(assignmentsById.get(offer.assignmentId), taker.membershipId);
      const { hardViolations } = evaluate([moved], ownContext(taker.membershipId), { skipSoft: true });

      if (hardViolations.length === 0) {
        edges.get(taker.id).push(offer.id);
        count += 1;
      } else {
        blocked.set(`${taker.id}|${offer.id}`, hardViolations.map((v) => v.code));
      }
    }
  }

  const edgeSets = new Map([...edges].map(([id, targets]) => [id, new Set(targets)]));
  return { edges, edgeSets, blocked, count };
}
