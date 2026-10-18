// shapes.js
// Small helpers that shape the finder's input and output: offers sorted and
// de-duplicated (so their arrival order can never change an answer), a
// ranked cycle turned into the Chain callers see, and the stats.

import { legsOf } from './applyCycle.js';

const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** One entry per offer id, sorted by id. */
export function orderedOffers(list) {
  return [...new Map(list.filter(Boolean).map((offer) => [offer.id, offer])).values()].sort(byId);
}

/** A ranked cycle as callers see it: its size, its offers in order, its hand-overs and its score. */
export function toChain({ cycle, score }) {
  return { size: cycle.length, offerIds: cycle.map((offer) => offer.id), legs: legsOf(cycle), score };
}

// How many times each rule code appears across some lists of codes.
function tally(codeLists) {
  const counts = {};
  for (const codes of codeLists) for (const code of codes) counts[code] = (counts[code] ?? 0) + 1;
  return counts;
}

/** The numbers behind an answer: how much was looked at, how long it took, and what stood in the way. */
export function statsOf({ offers, start, graph, search, durationMs }) {
  return {
    offersConsidered: offers.filter((offer) => offer.membershipId !== start?.membershipId).length,
    candidateEdges: graph.count,
    cyclesChecked: search.stats.cyclesChecked,
    validCycles: search.cycles.length,
    durationMs,
    truncated: search.stats.truncated,
    edgeBlockers: tally(graph.blocked.values()),
    validationBlockers: search.stats.blockedBy,
  };
}
