// findSwapOptions.js
// The swap chain finder's entry point.
//
// The steps, one file each: buildGraph (a cheap pre-filter of who might take
// whose shift), findCycles (a bounded search, checking every candidate cycle
// whole with validateCycle), rankChains (best first, with searchBound using
// the same scores to skip chains that could never make the list), and
// explainNoMatch when nothing is found.
//
// Search only: nothing here writes anything anywhere. Proposing, accepting,
// reserving and committing a chain are the services in services/swapChain/,
// whose status changes go through chainStateMachine.js.

import { buildGraph } from './buildGraph.js';
import { createCycleValidator } from './validateCycle.js';
import { findCycles } from './findCycles.js';
import { createScorer, rankChains } from './rankChains.js';
import { createSearchBound } from './searchBound.js';
import { explainNoMatch } from './explainNoMatch.js';
import { orderedOffers, toChain, statsOf } from './shapes.js';

export const SWAP_SEARCH_DEFAULTS = Object.freeze({
  maxLength: 4,
  topN: 5,
  limits: Object.freeze({ maxNodes: 200_000, maxCycles: 50_000, budgetMs: 400 }),
});

/**
 * Finds direct swaps and multi-person chains for one swap request.
 * PURE: all data passed in, no I/O, deterministic - the clock, if any, is
 * injected, and offers are sorted first, so their order never matters.
 *
 * input: { request, offers, assignments, context, fairnessDebt?, fairnessPolicy?,
 *          maxLength?, topN?, limits?, now? } - an offer is { id, membershipId, assignmentId }
 * @returns {{
 *   direct: Chain[],       // cycles of length 2
 *   chains: Chain[],       // cycles of length 3..maxLength
 *   noMatchReasons: Object | null,
 *   stats: { offersConsidered, candidateEdges, cyclesChecked, validCycles, durationMs, truncated,
 *            edgeBlockers,          // rule -> candidate edges the pre-filter ruled out
 *            validationBlockers }   // rule -> hand-overs that passed it but failed the full check
 * }}
 */
export function findSwapOptions(input) {
  const { request, assignments = [], context, fairnessDebt = {}, fairnessPolicy = {}, now } = input;
  const maxLength = Math.max(2, input.maxLength ?? SWAP_SEARCH_DEFAULTS.maxLength);
  const topN = input.topN ?? SWAP_SEARCH_DEFAULTS.topN;
  const limits = { ...SWAP_SEARCH_DEFAULTS.limits, ...input.limits };
  const clock = typeof now === 'function' ? now : null;
  const startedAt = clock ? clock() : 0;

  // An offer whose shift is not in the data cannot be reasoned about.
  const assignmentsById = new Map(assignments.map((a) => [a.id, a]));
  const offers = orderedOffers([...(input.offers ?? []), request]).filter((o) => assignmentsById.has(o.assignmentId));
  const offersById = new Map(offers.map((o) => [o.id, o]));
  const start = offersById.get(request?.id);

  const graph = buildGraph({ offers, assignmentsById, context });
  const { validate, codesFor } = createCycleValidator({ assignments, context });
  const scorer = createScorer({ assignmentsById, context, fairnessDebt, fairnessPolicy });
  const bound = createSearchBound({ scorer, edges: graph.edges, offersById, topN });
  const search = start
    ? findCycles({
        start,
        offersById,
        edges: graph.edges,
        edgeSets: graph.edgeSets,
        validate,
        codesFor,
        promising: bound.promising,
        onValid: bound.found,
        maxLength,
        limits,
        now,
        deadline: clock ? startedAt + limits.budgetMs : null,
      })
    : { cycles: [], stats: { cyclesChecked: 0, truncated: false, blockedBy: {} } };

  const ranked = rankChains(search.cycles, scorer);
  const direct = ranked.filter((r) => r.cycle.length === 2).slice(0, topN).map(toChain);
  const chains = ranked.filter((r) => r.cycle.length > 2).slice(0, topN).map(toChain);

  const noMatchReasons =
    direct.length + chains.length > 0
      ? null
      : start
        ? explainNoMatch({ request: start, offers, blocked: graph.blocked, codesFor, truncated: search.stats.truncated })
        : { offersChecked: 0, reasons: [], summary: 'The shift you offered could not be found.' };

  const durationMs = clock ? clock() - startedAt : 0;
  return { direct, chains, noMatchReasons, stats: statsOf({ offers, start, graph, search, durationMs }) };
}
