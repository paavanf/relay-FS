// swapBenchmarkReport.js
// The arithmetic and printing for benchmark-swaps.js: each group of timed
// searches boiled down to how many were resolved and how long they took,
// printed as a markdown table that can go straight into the README.

const percent = (n, of) => (of === 0 ? '-' : `${((100 * n) / of).toFixed(1)}%`);
const ms = (value) => value.toFixed(1);

/** The nearest-rank percentile (p from 0 to 1) of an ascending list. */
export function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))];
}

/** Adds one count map into another: { MIN_REST: 2 } + { MIN_REST: 1 } = { MIN_REST: 3 }. */
export function addCounts(into, from) {
  for (const [code, n] of Object.entries(from ?? {})) into[code] = (into[code] ?? 0) + n;
  return into;
}

/** Timed searches ({ result, ms }) boiled down: what they found, and how long they took. */
export function summarise(runs) {
  const times = runs.map((run) => run.ms).sort((a, b) => a - b);
  return {
    searches: runs.length,
    direct: runs.filter((run) => run.result.direct.length > 0).length,
    resolved: runs.filter((run) => run.result.direct.length + run.result.chains.length > 0).length,
    cutShort: runs.filter((run) => run.result.stats.truncated).length,
    median: percentile(times, 0.5),
    p95: percentile(times, 0.95),
    max: times.at(-1) ?? 0,
  };
}

export function printTable(wards) {
  console.log('| Ward | Offers | Max chain (L) | Searches | Direct swap | Resolved (any chain up to L) | Median ms | p95 ms | Cut short |');
  console.log('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const { name, rows } of wards) {
    for (const row of rows) {
      const cells = [name, row.size, row.maxLength, row.searches, percent(row.direct, row.searches), percent(row.resolved, row.searches)];
      console.log(`| ${[...cells, ms(row.median), ms(row.p95), row.cutShort].join(' | ')} |`);
    }
  }
}

// Rule codes, most frequent first: "MIN_REST 1,204 · DOUBLE_BOOKED 310".
const listed = (counts) =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([code, n]) => `${code} ${n.toLocaleString('en-GB')}`)
    .join(' · ') || 'nothing';

/** Why requests could or could not be resolved, from the L = 4 searches of one ward. */
export function printWhy({ name, why }) {
  console.log(`\n${name} - what stood in the way (all L = 4 searches):`);
  console.log(`  pre-filter: ${percent(why.candidates, why.pairs)} of possible hand-overs are candidates; ruled out by ${listed(why.edgeBlockers)}`);
  console.log(`  full check of a person's week refused: ${listed(why.validationBlockers)}`);
  console.log(`  requests with only a longer chain (no direct swap): ${why.chainOnly} of ${why.searches}`);
}

export function printTarget(target, summary) {
  const met = summary.max < target.underMs && summary.cutShort === 0;
  console.log(`\nPerformance target: ${target.name}, ${target.offers} open offers (everyone has offered a shift), L = ${target.maxLength}`);
  console.log(`  with a random fairness debt for everyone and a third of the team preferring one weekday`);
  console.log(`  ${summary.searches} searches: median ${ms(summary.median)} ms, p95 ${ms(summary.p95)} ms, slowest ${ms(summary.max)} ms, cut short ${summary.cutShort}`);
  console.log(`  every search finished, uncut, in under ${target.underMs} ms: ${met ? 'yes' : 'NO'}`);
}
