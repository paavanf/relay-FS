// benchmark-swaps.js
// How often can a swap request be resolved - by a direct swap, or by a chain
// of up to L people - and how long does one search take?
//
//   npm run benchmark:swaps
//
// GENERATED SCENARIOS, not data from a real ward. The evaluation harness's
// wards (scenarios.js) - two 40-person ones and the 12-person understaffed
// one - are each rostered once by the real generator. Then, 30 times over
// for each pool size, a random 5, 10 or 20 of their people each offer one of
// their own shifts, and every one of them asks for options with a maximum
// chain length of 2, 3 and 4. Last, the performance target: a 100-person
// ward where everyone has offered a shift, L = 4, each search under 500 ms.
//
// Searches run as the app runs them - findSwapOptions with its default
// bounds and the clock injected - and are timed around the call. Pure
// computation: no database, no network, no server. The pools are seeded, so
// only the timings change from run to run.

import { findSwapOptions } from '../src/engine/index.js';
import { WARDS, LARGE_WARD, rosterFor, contextOf, withRankingData, seededRandom, poolOf } from './swapBenchmarkParts.js';
import { summarise, addCounts, printTable, printWhy, printTarget } from './swapBenchmarkReport.js';

const POOL_SIZES = [5, 10, 20];
const MAX_LENGTHS = [2, 3, 4];
const POOLS_PER_SIZE = 30;
const TARGET = { name: LARGE_WARD.name, offers: 100, maxLength: 4, pools: 3, underMs: 500 };
const SEED = 20260405;

const clock = () => performance.now();

/** One search, timed around the call, as the options endpoint makes it. */
function timedSearch(input) {
  const startedAt = clock();
  const result = findSwapOptions({ ...input, now: clock });
  return { result, ms: clock() - startedAt };
}

function measureWard(ward) {
  const assignments = rosterFor(ward);
  const context = contextOf(ward);
  const random = seededRandom(SEED);
  const rows = [];
  const why = { pairs: 0, candidates: 0, edgeBlockers: {}, validationBlockers: {}, chainOnly: 0, searches: 0 };

  for (const size of POOL_SIZES.filter((n) => n <= ward.workers.length)) {
    const runs = new Map(MAX_LENGTHS.map((maxLength) => [maxLength, []]));

    for (let pool = 0; pool < POOLS_PER_SIZE; pool += 1) {
      const offers = poolOf(assignments, size, random);
      for (const request of offers) {
        for (const maxLength of MAX_LENGTHS) {
          const run = timedSearch({ request, offers, assignments, context, maxLength });
          runs.get(maxLength).push(run);
          if (maxLength !== 4) continue;

          const { stats, direct, chains } = run.result;
          why.pairs += offers.length * (offers.length - 1);
          why.candidates += stats.candidateEdges;
          addCounts(why.edgeBlockers, stats.edgeBlockers);
          addCounts(why.validationBlockers, stats.validationBlockers);
          if (direct.length === 0 && chains.length > 0) why.chainOnly += 1;
          why.searches += 1;
        }
      }
    }
    for (const [maxLength, list] of runs) rows.push({ size, maxLength, ...summarise(list) });
  }
  return { name: ward.name, rows, why };
}

function measureTarget() {
  const assignments = rosterFor(LARGE_WARD);
  const { context, fairnessDebt } = withRankingData(LARGE_WARD, seededRandom(SEED + 1));
  const random = seededRandom(SEED + 2);
  const runs = [];

  for (let pool = 0; pool < TARGET.pools; pool += 1) {
    const offers = poolOf(assignments, TARGET.offers, random);
    for (const request of offers) runs.push(timedSearch({ request, offers, assignments, context, fairnessDebt, maxLength: TARGET.maxLength }));
  }
  return summarise(runs);
}

console.log('\nSwap options benchmark - GENERATED SCENARIOS (the evaluation harness wards), not data from a real ward.');
console.log(`${POOLS_PER_SIZE} random pools per size; every offer in a pool asks once at each maximum chain length.\n`);

const wards = WARDS.map(measureWard);
printTable(wards);
wards.forEach(printWhy);
printTarget(TARGET, measureTarget());
console.log('');
