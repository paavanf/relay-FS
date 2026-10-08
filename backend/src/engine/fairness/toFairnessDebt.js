// toFairnessDebt.js
// Turns a ledger into the map the generator already reads:
// { membershipId: number }.
//
// The consumers - constraints/soft/fairnessDebt.js and scheduling/
// scoreCandidate.js - came first, and are NOT changed to fit this. This fits
// them:
//
//   sign   positive = carrying MORE than a fair share. Zero or negative is
//          ignored by both, so nobody is pushed towards extra burden by it.
//   scale  burden points - the unit a shift's burdenWeight is in. Their
//          penalty is debt x burdenWeight, summed beside an "avoid" penalty of
//          5, so a percentage like 0.12 would be lost in the noise.
//
// A worker's debt is therefore how many burden points they carried beyond
// what the team-average rate would give them for the same basis hours:
//
//   debt = totalBurden - teamAverage / referenceHours x basisHours
//        = basisHours / referenceHours x (normalisedBurden - teamAverage)
//
// With no published work in the window there is no history at all, and the
// result is {} - exactly what the generator received before this milestone.

import { positiveOr } from './numbers.js';

/**
 * @param {{ teamAverage: number, rows: Array<{ membershipId: string,
 *          totalBurden: number, basisHours: number, measured: boolean }> }} ledger
 * @param {{ referenceHours?: number }} policy  the same policy computeLedger used
 * @returns {Record<string, number>}
 */
export function toFairnessDebt(ledger, policy = {}) {
  const rows = ledger?.rows ?? [];
  if (!rows.some((row) => row.totalBurden > 0)) return {};

  const ratePerHour = (ledger.teamAverage ?? 0) / positiveOr(policy.referenceHours, 40);
  const debt = {};

  for (const row of rows) {
    if (!row.measured) continue; // nothing carried, nothing owed
    debt[row.membershipId] = row.totalBurden - ratePerHour * row.basisHours;
  }

  return debt;
}
