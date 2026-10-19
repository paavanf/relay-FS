// benchmark-swaps.js
// How often can a swap request be resolved - by a direct swap, or by a chain
// of up to L people - how often ONLY by a chain, and how long does a search
// take?
//
//   npm run benchmark:swaps
//
// GENERATED SCENARIOS, not data from a real ward. The scenarios were written
// down before the first run (swapBenchmarkWards.js, swapBenchmarkPools.js and
// the README) and are not tuned to the results:
//
//   table 1  the evaluation harness's wards, offers taking any shift
//   table 2  the mixed-role ward, with every offer taking only a share of
//            shift types and weekdays in return: 100%, 60%, 30%, 15%
//
// Each: 30 random pools for each of 5, 10 and 20 offers; every offer asks at
// a maximum chain length of 2, 3 and 4. Then the performance target: a
// 100-person ward where everyone has offered a shift, L = 4, under 500 ms.
//
// Searches run as the app runs them - findSwapOptions with its default
// bounds and the clock injected - and are timed around the call. Pure
// computation: no database, no network, no server.

import { findSwapOptions } from '../src/engine/index.js';
import { WARDS, MIXED_WARD, LARGE_WARD, rosterFor, contextOf, withRankingData } from './swapBenchmarkWards.js';
import { seededRandom, poolOf, withFilters } from './swapBenchmarkPools.js';
import { summarise, tallyWhy, printTable, printWhy, printTarget } from './swapBenchmarkReport.js';

const POOL_SIZES = [5, 10, 20];
const MAX_LENGTHS = [2, 3, 4];
const POOLS_PER_SIZE = 30;
const WILLINGNESS = [1, 0.6, 0.3, 0.15];
const TARGET = { name: LARGE_WARD.name, offers: 100, maxLength: 4, pools: 3, underMs: 500 };
const SEED = 20260405;

const clock = () => performance.now();
const rosters = new Map();
const rosterOf = (ward) => rosters.get(ward) ?? rosters.set(ward, rosterFor(ward)).get(ward);

/** One search, timed around the call, as the options endpoint makes it. */
function timedSearch(input) {
  const startedAt = clock();
  const result = findSwapOptions({ ...input, now: clock });
  return { result, ms: clock() - startedAt };
}

function measure(ward, share = 1) {
  const assignments = rosterOf(ward);
  const context = contextOf(ward);
  const pools = seededRandom(SEED); // the same pools at every share...
  const wishes = seededRandom(SEED + 1); // ...and the filters drawn on their own
  const rows = [];
  const why = { pairs: 0, candidates: 0, edgeBlockers: {}, validationBlockers: {}, chainOnly: 0, searches: 0 };

  for (const size of POOL_SIZES.filter((n) => n <= ward.workers.length)) {
    const runs = new Map(MAX_LENGTHS.map((maxLength) => [maxLength, []]));
    for (let pool = 0; pool < POOLS_PER_SIZE; pool += 1) {
      const offers = withFilters(poolOf(assignments, size, pools), share, wishes);
      for (const request of offers) {
        for (const maxLength of MAX_LENGTHS) {
          const run = timedSearch({ request, offers, assignments, context, maxLength });
          runs.get(maxLength).push(run);
          if (maxLength === 4) tallyWhy(why, offers, run.result);
        }
      }
    }
    for (const [maxLength, list] of runs) rows.push({ size, maxLength, ...summarise(list) });
  }
  return { rows, why };
}

function measureTarget() {
  const assignments = rosterOf(LARGE_WARD);
  const { context, fairnessDebt } = withRankingData(LARGE_WARD, seededRandom(SEED + 2));
  const pools = seededRandom(SEED + 3);
  const runs = [];
  for (let pool = 0; pool < TARGET.pools; pool += 1) {
    const offers = poolOf(assignments, TARGET.offers, pools);
    for (const request of offers) runs.push(timedSearch({ request, offers, assignments, context, fairnessDebt, maxLength: TARGET.maxLength }));
  }
  return summarise(runs);
}

console.log('\nSwap options benchmark - GENERATED SCENARIOS, not data from a real ward.');
console.log(`${POOLS_PER_SIZE} random pools per size; every offer in a pool asks once at each maximum chain length.`);

const harness = WARDS.map((ward) => ({ label: ward.name, ...measure(ward) }));
printTable('Table 1 - the evaluation harness wards, offers taking any shift', 'Ward', harness);
const sweep = WILLINGNESS.map((share) => ({ label: `${Math.round(share * 100)}%`, ...measure(MIXED_WARD, share) }));
printTable(`Table 2 - ${MIXED_WARD.name}, each offer taking this share of shift types and weekdays`, 'Willingness', sweep);

[...harness, ...sweep.map((s) => ({ ...s, label: `${MIXED_WARD.name}, willingness ${s.label}` }))].forEach(printWhy);
printTarget(TARGET, measureTarget());
console.log('');
