// evaluate-fairness.js
// Does feeding the fairness ledger back into the generator make rosters fairer
// over time - or does it over-correct and swing back and forth?
//
//   npm run evaluate:fairness
//
// The 40-person ward from scenarios.js, rostered for four consecutive 14-day
// periods. After each period its roster is treated as published history; the
// ledger over everything so far gives each worker's fairness debt, which is
// fed into the next period exactly as loadGenerationInput does in the app.
// Run twice from the same seeds - feedback on, feedback off - and the spread
// of normalised burden after each period is printed side by side.
//
// Deterministic: fixed seeds and an iteration cap, no wall-clock deadline.
// These are generated scenarios, not data from a real ward.

import { generateRoster } from '../src/engine/index.js';
import { SCENARIOS, SEED, MAX_ITERATIONS } from './scenarios.js';
import { periodsOf, ledgerUpTo, debtBefore, spreadOf, oscillates } from './fairnessExperimentParts.js';

const PERIODS = 4;
const ward = SCENARIOS.find((s) => s.name.startsWith('Hospital ward'));

function run({ feedback }) {
  const history = [];

  return periodsOf(ward, PERIODS).map((period, index) => {
    const fairnessDebt = feedback ? debtBefore(ward, history, period.startDate) : undefined;
    const result = generateRoster({
      ...ward,
      ...period,
      fairnessDebt,
      seed: SEED + index,
      maxIterations: MAX_ITERATIONS,
    });

    history.push(...result.assignments);
    const spread = spreadOf(ledgerUpTo(ward, history, period.endDate));
    return { ...period, ...spread, unfilled: result.unfilledSlots.length };
  });
}

const fixed = (n) => n.toFixed(3).padStart(7);
const on = run({ feedback: true });
const off = run({ feedback: false });

console.log(`\nFairness convergence - ${ward.name}, ${PERIODS} consecutive 14-day periods (generated scenario)`);
console.log('Spread of normalised burden (burden per full-time week) over all history so far.\n');
console.log('Period                     |  Feedback ON: std dev  max-min  unfilled |  Feedback OFF: std dev  max-min  unfilled');
console.log('-'.repeat(112));
on.forEach((row, i) => {
  const other = off[i];
  console.log(
    `${i + 1}  ${row.startDate} - ${row.endDate}  |              ${fixed(row.stdDev)}  ${fixed(row.range)}  ${String(row.unfilled).padStart(8)} |` +
      `               ${fixed(other.stdDev)}  ${fixed(other.range)}  ${String(other.unfilled).padStart(8)}`,
  );
});

const onSeries = on.map((r) => r.stdDev);
const narrowing = onSeries.every((value, i) => i === 0 || value <= onSeries[i - 1]);
console.log(`\nFeedback ON  std dev: ${onSeries.map((v) => v.toFixed(3)).join(' -> ')}`);
console.log(`Feedback OFF std dev: ${off.map((r) => r.stdDev.toFixed(3)).join(' -> ')}`);
console.log(`Narrows every period with feedback: ${narrowing ? 'yes' : 'no'}`);
console.log(`Oscillates (over-corrects back and forth) with feedback: ${oscillates(onSeries) ? 'YES - the fairness weight is too aggressive' : 'no'}`);
console.log(`After the last period, feedback ON's spread is ${((onSeries.at(-1) / off.at(-1).stdDev) * 100).toFixed(0)}% of feedback OFF's.\n`);
