// evaluate-generation.js
// Runs the generator over fixed scenarios and prints the numbers.
//
// This is not a test - nothing here passes or fails. It is the instrument
// panel: without it, tuning a weight is guesswork, because "the roster looks
// better" is not a measurement. Every scenario uses a fixed seed, so any
// change in the table came from a change in the code.
//
// Pure computation. No database, no network, no server.
//
//   npm run evaluate                 baseline numbers
//   npm run evaluate -- --compare    baseline against a variant, side by side

import { generateRoster, evaluate, DEFAULT_WEIGHTS } from '../src/engine/index.js';
import { SCENARIOS, SEED, MAX_ITERATIONS } from './scenarios.js';

const DEADLINE_MS = 5000;

// The variant --compare measures against. Change this to whatever you are
// considering, run it, and see whether the numbers actually move.
const VARIANT = { ...DEFAULT_WEIGHTS, fairnessVariance: 40, flexibility: 6 };

function run(scenario, weights) {
  const startedAt = Date.now();

  const result = generateRoster({
    ...scenario,
    weights,
    seed: SEED,
    maxIterations: MAX_ITERATIONS,
    deadlineMs: DEADLINE_MS,
    now: Date.now,
  });

  // The headline check: whatever the generator produced must be legal.
  const { isValid, hardViolations } = evaluate(result.assignments, {
    workers: scenario.workers,
    shiftTemplates: scenario.shiftTemplates,
    availability: scenario.availability,
    coverage: scenario.coverageRequirements,
    rules: scenario.rules,
    timezone: scenario.timezone,
  });

  return {
    ...result.metrics,
    filled: result.assignments.length,
    isValid,
    violations: hardViolations.length,
    wallMs: Date.now() - startedAt,
  };
}

function pad(value, width, right = true) {
  const text = String(value);
  return right ? text.padStart(width) : text.padEnd(width);
}

function printTable(rows, label) {
  console.log(`\n${label}`);
  console.log(
    pad('Scenario', 44, false) + pad('Slots', 7) + pad('Filled', 7) + pad('Unfilled', 9) +
      pad('Objective', 11) + pad('Iters', 7) + pad('ms', 7) + pad('Legal', 7),
  );
  console.log('-'.repeat(99));

  for (const { name, m } of rows) {
    console.log(
      pad(name, 44, false) + pad(m.totalSlots, 7) + pad(m.filled, 7) + pad(m.unfilledCount, 9) +
        pad(Math.round(m.objectiveScore), 11) + pad(m.iterations, 7) + pad(m.wallMs, 7) +
        pad(m.isValid ? 'yes' : `NO(${m.violations})`, 7),
    );
  }
}

function main() {
  const compare = process.argv.includes('--compare');

  const baseline = SCENARIOS.map((s) => ({ name: s.name, m: run(s, DEFAULT_WEIGHTS) }));
  printTable(baseline, 'BASELINE (DEFAULT_WEIGHTS)');

  if (!compare) {
    console.log('\nRun with --compare to measure a weight change against this.');
    return;
  }

  const variant = SCENARIOS.map((s) => ({ name: s.name, m: run(s, VARIANT) }));
  printTable(variant, 'VARIANT');

  console.log('\nDELTA (variant minus baseline; negative objective = better)');
  console.log(pad('Scenario', 44, false) + pad('d Objective', 13) + pad('d Unfilled', 12));
  console.log('-'.repeat(69));
  baseline.forEach((row, i) => {
    console.log(
      pad(row.name, 44, false) +
        pad(Math.round(variant[i].m.objectiveScore - row.m.objectiveScore), 13) +
        pad(variant[i].m.unfilledCount - row.m.unfilledCount, 12),
    );
  });
}

main();
