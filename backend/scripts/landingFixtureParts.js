// landingFixtureParts.js
// Helpers for export-landing-fixture.js: run a scenario through the
// generator, then summarise what came out. Pure computation - nothing here
// touches a database, the network or the clock.

import { generateRoster, evaluate } from '../src/engine/index.js';
import { SCENARIOS, SEED, MAX_ITERATIONS } from './scenarios.js';

// Display labels for the cafe's eight membership ids. Only the names are
// added; every assignment, verdict and reason stays exactly as the engine
// produced it.
const DISPLAY_NAMES = ['Asha', 'Ben', 'Chen', 'Divya', 'Elena', 'Femi', 'Grace', 'Hugo'];

export function contextOf(scenario) {
  return {
    workers: scenario.workers,
    shiftTemplates: scenario.shiftTemplates,
    availability: scenario.availability,
    coverage: scenario.coverageRequirements,
    rules: scenario.rules,
    timezone: scenario.timezone,
  };
}

// Runs one scenario with the same seed and budget as `npm run evaluate`. The
// whole point of the demo is that the output is legal, so it refuses to hand
// back a roster that is not.
export function run(name) {
  const scenario = SCENARIOS.find((s) => s.name.startsWith(name));
  const result = generateRoster({ ...scenario, seed: SEED, maxIterations: MAX_ITERATIONS });

  const { isValid, hardViolations } = evaluate(result.assignments, contextOf(scenario));
  if (!isValid) throw new Error(`${scenario.name}: ${hardViolations.length} hard violations`);

  return { scenario, result };
}

export function membersOf(scenario) {
  return scenario.workers.map((w, i) => ({ id: w.membershipId, name: DISPLAY_NAMES[i] ?? w.membershipId }));
}

export function dayCount(scenario) {
  return Math.round((Date.parse(scenario.endDate) - Date.parse(scenario.startDate)) / 86_400_000) + 1;
}

export function totalsOf(scenario, result) {
  return {
    people: scenario.workers.length,
    days: dayCount(scenario),
    shifts: result.metrics.totalSlots,
    filled: result.assignments.length,
    unfilled: result.unfilledSlots.length,
  };
}

// How many people each rule stopped, summed over every unfilled slot.
export function blockedByRule(unfilledSlots) {
  const totals = {};
  for (const slot of unfilledSlots) {
    for (const [code, n] of Object.entries(slot.blockedBy)) totals[code] = (totals[code] ?? 0) + n;
  }
  return totals;
}
