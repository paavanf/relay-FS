// findCycles.js
// Bounded search for cycles through the requester's offer.
//
// Cost: a cycle of length L through one start node is one of up to d^(L-1)
// paths, where d is the average number of candidate edges per offer -
// searching from every node would be O(V · d^L). That exponent is why L is
// capped (the organisation's maxChainLength, 4 by default), and it is not
// only about time: every extra person in a chain is another person who has
// to accept before it expires.
//
// Shorter cycles are searched first (iterative deepening: every 2-cycle,
// then every 3-cycle, ...), so if a bound cuts the search short, what is
// kept are the short options, and the result says it was cut short.
//
// Bounds: nodes expanded, cycles validated, and a deadline checked against
// the injected now() - the engine never reads a clock of its own.
//
// Pruning, two kinds, neither of which changes the answer:
//   legality  a person's part of any cycle is fixed by the shift they offer
//             and the shift they take, so each hand-over is checked as the
//             path grows (handOverCheck.js) - with the given shift removed
//             and the rest of their week counted, so a path it cuts could
//             never have become a valid cycle
//   ranking   promising() drops a path that could not make the list even if
//             it finished as well as possible (searchBound.js)
// Every finished cycle is still checked whole with validate().
//
// Each worker appears at most once per cycle (and so does each offer). A
// cycle always starts at the requester, so it is found in one rotation only;
// canonicalKey still guards that, rather than trusting it silently.

import { canonicalKey } from './applyCycle.js';
import { createHandOverCheck } from './handOverCheck.js';

export function findCycles({ start, offersById, edges, edgeSets, validate, codesFor = () => [], promising = () => true, onValid = () => {}, maxLength, limits, now, deadline = null }) {
  const valid = [];
  const seen = new Set();
  const { canTake, closes, blockedBy } = createHandOverCheck({ codesFor, edgeSets, start });
  const stats = { nodesExpanded: 0, cyclesChecked: 0, truncated: false, blockedBy };

  const overBudget = () =>
    stats.nodesExpanded >= limits.maxNodes ||
    stats.cyclesChecked >= limits.maxCycles ||
    (deadline !== null && now() >= deadline);

  function consider(path) {
    const key = canonicalKey(path);
    if (seen.has(key)) return;
    seen.add(key);
    stats.cyclesChecked += 1;

    if (!validate(path).valid) return;
    const cycle = [...path];
    valid.push(cycle);
    onValid(cycle);
  }

  function extend(path, workers, length) {
    if (overBudget()) {
      stats.truncated = true;
      return;
    }
    if (!promising(path, length)) return;
    stats.nodesExpanded += 1;

    // Full length: every hand-over was checked on the way, the closing one too.
    if (path.length === length) return consider(path);

    const last = path[path.length - 1];
    const lastStep = path.length + 1 === length;
    for (const nextId of edges.get(last.id) ?? []) {
      const next = offersById.get(nextId);
      if (workers.has(next.membershipId)) continue;
      // The last person must also be able to take the requester's shift -
      // asked first, since it is one question per person, not per path.
      if (lastStep && !closes(next)) continue;
      if (!canTake(last, next)) continue;

      path.push(next);
      workers.add(next.membershipId);
      extend(path, workers, length);
      path.pop();
      workers.delete(next.membershipId);
      if (stats.truncated) return;
    }
  }

  for (let length = 2; length <= maxLength && !stats.truncated; length += 1) {
    extend([start], new Set([start.membershipId]), length);
  }

  // Where open shifts would plug in, in a later version: an unassigned shift
  // could seed a path that ends with whoever takes it, instead of a cycle.
  return { cycles: valid, stats };
}
