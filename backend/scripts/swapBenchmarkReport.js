// swapBenchmarkReport.js
// The arithmetic and printing for benchmark-swaps.js: each group of timed
// searches boiled down to what they found and how long they took, printed as
// markdown tables that can go straight into the README.
//
// "Only by a chain" is the number that shows what chains add: requests with
// an option once chains of up to L people count, but no direct swap.

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

/** Adds one L = 4 search to the tally of what stood in the way (printWhy). */
export function tallyWhy(why, offers, { stats, direct, chains }) {
  why.pairs += offers.length * (offers.length - 1);
  why.candidates += stats.candidateEdges;
  addCounts(why.edgeBlockers, stats.edgeBlockers);
  addCounts(why.validationBlockers, stats.validationBlockers);
  if (direct.length === 0 && chains.length > 0) why.chainOnly += 1;
  why.searches += 1;
}

/** Timed searches ({ result, ms }) boiled down: what they found, and how long they took. */
export function summarise(runs) {
  const times = runs.map((run) => run.ms).sort((a, b) => a - b);
  const direct = (run) => run.result.direct.length > 0;
  const resolved = (run) => direct(run) || run.result.chains.length > 0;
  return {
    searches: runs.length,
    direct: runs.filter(direct).length,
    resolved: runs.filter(resolved).length,
    chainOnly: runs.filter((run) => resolved(run) && !direct(run)).length,
    cutShort: runs.filter((run) => run.result.stats.truncated).length,
    median: percentile(times, 0.5),
    p95: percentile(times, 0.95),
    max: times.at(-1) ?? 0,
  };
}

const HEAD = '| Offers | Max chain (L) | Searches | Direct swap | Resolved (chains up to L) | Only by a chain | Median ms | p95 ms | Cut short |';
const cells = (row) => [row.size, row.maxLength, row.searches, percent(row.direct, row.searches), percent(row.resolved, row.searches),
  percent(row.chainOnly, row.searches), ms(row.median), ms(row.p95), row.cutShort];

/** One table, a row per (label, offers, L): the label is a ward's name or a willingness share. */
export function printTable(title, firstColumn, groups) {
  console.log(`\n${title}\n\n| ${firstColumn} ${HEAD}`);
  console.log(`| --- ${'| ---: '.repeat(9)}|`);
  for (const { label, rows } of groups) for (const row of rows) console.log(`| ${[label, ...cells(row)].join(' | ')} |`);
}

// Rule codes, most frequent first: "MIN_REST 1,204, DOUBLE_BOOKED 310".
const listed = (counts) =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([code, n]) => `${code} ${n.toLocaleString('en-GB')}`)
    .join(', ') || 'nothing';

/** Why requests could or could not be resolved, from one group's L = 4 searches. */
export function printWhy({ label, why }) {
  console.log(`\n${label} - what stood in the way (all L = 4 searches):`);
  console.log(`  pre-filter: ${percent(why.candidates, why.pairs)} of possible hand-overs are candidates; ruled out by ${listed(why.edgeBlockers)}`);
  console.log(`  full check of a person's week refused: ${listed(why.validationBlockers)}`);
  console.log(`  requests only a chain resolves: ${why.chainOnly} of ${why.searches}`);
}

export function printTarget(target, summary) {
  const met = summary.max < target.underMs && summary.cutShort === 0;
  console.log(`\nPerformance target: ${target.name}, ${target.offers} open offers (everyone has offered a shift), L = ${target.maxLength}`);
  console.log(`  with a random fairness debt for everyone and a third of the team preferring one weekday`);
  console.log(`  ${summary.searches} searches: median ${ms(summary.median)} ms, p95 ${ms(summary.p95)} ms, slowest ${ms(summary.max)} ms, cut short ${summary.cutShort}`);
  console.log(`  every search finished, uncut, in under ${target.underMs} ms: ${met ? 'yes' : 'NO'}`);
}
