// fairnessExperimentParts.js
// Helpers for evaluate-fairness.js. Pure computation over engine output -
// nothing here touches a database, the network or the clock.

import {
  computeLedger,
  toFairnessDebt,
  fairnessWindow,
  windowBefore,
  clampWindowStart,
} from '../src/engine/index.js';
import { DEFAULT_FAIRNESS_POLICY, FAIRNESS_WINDOW_DAYS } from '../src/config/fairness.js';

const DAY_MS = 86_400_000;

function addDays(isoDate, days) {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** `count` back-to-back periods the length of the scenario's own roster. */
export function periodsOf(scenario, count) {
  const length = Math.round((Date.parse(scenario.endDate) - Date.parse(scenario.startDate)) / DAY_MS) + 1;
  return Array.from({ length: count }, (_, i) => ({
    startDate: addDays(scenario.startDate, i * length),
    endDate: addDays(scenario.startDate, i * length + length - 1),
  }));
}

// The same ledger the app stores: 12 weeks, trimmed to when history began.
function ledgerFor(scenario, history, window) {
  return computeLedger({
    assignments: history,
    workers: scenario.workers,
    shiftTemplates: scenario.shiftTemplates,
    policy: DEFAULT_FAIRNESS_POLICY,
    window: clampWindowStart(window, scenario.startDate),
    timezone: scenario.timezone,
  });
}

/** The ledger over all published history up to and including `endDate`. */
export function ledgerUpTo(scenario, history, endDate) {
  return ledgerFor(scenario, history, fairnessWindow(endDate, FAIRNESS_WINDOW_DAYS));
}

/** What loadGenerationInput passes: the debt from the history before `startDate`. */
export function debtBefore(scenario, history, startDate) {
  const ledger = ledgerFor(scenario, history, windowBefore(startDate, FAIRNESS_WINDOW_DAYS));
  return toFairnessDebt(ledger, DEFAULT_FAIRNESS_POLICY);
}

/** How unevenly burden is shared: population std dev and max - min of normalisedBurden. */
export function spreadOf(ledger) {
  const values = ledger.rows.filter((row) => row.measured).map((row) => row.normalisedBurden);
  if (values.length === 0) return { stdDev: 0, range: 0 };

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return { stdDev: Math.sqrt(variance), range: Math.max(...values) - Math.min(...values) };
}

/** True when a series goes down then up (or up then down) more than once. */
export function oscillates(series) {
  const steps = series.slice(1).map((value, i) => Math.sign(value - series[i])).filter((s) => s !== 0);
  const turns = steps.slice(1).filter((s, i) => s !== steps[i]).length;
  return turns >= 2;
}
