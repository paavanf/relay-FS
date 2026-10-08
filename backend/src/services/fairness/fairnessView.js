// fairnessView.js
// Shapes stored ledger rows into API responses. Pure - no queries.
//
// Figures are rounded here, for the wire only. The stored rows keep full
// precision, so a recompute and a later read never disagree.

import { DEFAULT_FAIRNESS_POLICY, FAIRNESS_WINDOW_DAYS } from '../../config/fairness.js';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const DAY_MS = 86_400_000;

function daysInclusive(startDate, endDate) {
  return Math.round((Date.parse(endDate) - Date.parse(startDate)) / DAY_MS) + 1;
}

// The rules the figures were computed with, so the page can explain them
// without keeping its own copy of the numbers.
const POLICY = {
  weekendMultiplier: DEFAULT_FAIRNESS_POLICY.weekendMultiplier,
  referenceHours: DEFAULT_FAIRNESS_POLICY.referenceHours,
  windowDays: FAIRNESS_WINDOW_DAYS,
};

/** What every viewer may see: the window, when it was computed, the average. */
export function sharedFigures(meta) {
  if (!meta) return { window: null, computedAt: null, teamAverage: { normalisedBurden: 0 }, policy: POLICY };

  return {
    policy: POLICY,
    window: {
      startDate: meta.windowStart,
      endDate: meta.windowEnd,
      days: daysInclusive(meta.windowStart, meta.windowEnd),
    },
    computedAt: new Date(meta.computedAt).toISOString(),
    teamAverage: { normalisedBurden: round2(meta.teamAverage) },
  };
}

/** One person's figures. Deliberately no id and no name. */
export function personalFigures(row) {
  const counts = row.shiftCounts ?? {};

  return {
    measured: Boolean(row.measured),
    hoursWorked: round2(row.hoursWorked),
    shiftsWorked: row.shiftsWorked ?? 0,
    totalBurden: round2(row.totalBurden),
    normalisedBurden: round2(row.normalisedBurden),
    deviationPercent: round2(row.deviationPercent),
    shiftCounts: {
      day: counts.day ?? 0,
      evening: counts.evening ?? 0,
      night: counts.night ?? 0,
      weekend: counts.weekend ?? 0,
    },
  };
}
