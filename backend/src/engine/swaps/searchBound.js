// searchBound.js
// Lets the search skip chains that could never make the list.
//
// The list keeps the best topN chains of three or more people. Once it is
// full, a new chain has to beat the worst one on it. A path whose best
// possible finish (rankChains' lowestTotal) is already worse can be dropped,
// along with every longer path it would have grown into. The answer is the
// same as searching everything; it is only found sooner.
//
// This is what keeps a big, busy pool fast. There, plenty of three-person
// chains fill the list early, a fourth person costs perPerson more, and
// almost no four-person path can catch up - so the hundreds of thousands of
// them are never walked. Direct swaps are always searched in full: there are
// few, and every one is wanted.

export function createSearchBound({ scorer, edges, offersById, topN }) {
  const kept = []; // the best chain totals so far, lowest first, at most topN
  let bestHandOver = null;

  // The lowest cost any one hand-over could add, over every candidate edge
  // (a superset of the legal ones, so still a safe bound). Worked out once,
  // and only if the list ever fills.
  function best() {
    if (bestHandOver === null) {
      bestHandOver = Infinity;
      for (const [takerId, targets] of edges) {
        for (const offerId of targets) bestHandOver = Math.min(bestHandOver, scorer.handOverCost(offersById.get(takerId), offersById.get(offerId)));
      }
    }
    return bestHandOver;
  }

  /** Told about every valid cycle the search finds. */
  function found(cycle) {
    if (cycle.length < 3) return;
    const total = scorer.score(cycle).total;
    if (kept.length >= topN && total >= kept[kept.length - 1]) return;

    const at = kept.findIndex((t) => t > total);
    kept.splice(at === -1 ? kept.length : at, 0, total);
    if (kept.length > topN) kept.pop();
  }

  /** Could a chain of `length` people that begins with `path` still make the list? */
  function promising(path, length) {
    if (length < 3 || topN < 1 || kept.length < topN) return true;
    return scorer.lowestTotal(path, length, best()) <= kept[topN - 1];
  }

  return { found, promising };
}
