// computeLedger.js
// One row per worker: how much burden they carried in the window, and how
// that compares with the rest of the team.
//
// THE FORMULA, AND WHY RAW TOTALS WOULD BE UNFAIR
// Someone contracted for 20 hours a week works about half the shifts of a
// 40-hour colleague. Compared on raw totals they would always look "under",
// even if every shift they worked was a night, and the full-timer would look
// "over" for doing no more than their contract. So burden is measured against
// the hours each person was SUPPOSED to work, over the time they were here:
//
//   weeklyHours      = contractedHoursPerWeek, or referenceHours (40) when no
//                      contract is on file
//   basisHours       = weeklyHours x weeks of the window since they joined
//   normalisedBurden = totalBurden / basisHours x referenceHours
//                      ("burden per full-time week" - five day shifts read 5)
//   teamAverage      = mean normalisedBurden of the measured workers
//   deviationPercent = (normalisedBurden - teamAverage) / teamAverage x 100
//
// Why not divide by the hours someone actually worked when there is no
// contract? Because then one more heavy shift could LOWER their figure: a long
// night adds hours as well as burden. Taking on more of the unpopular work
// must never make anyone look less burdened. (Nothing in Relay records
// contracted hours yet, so today everyone is measured on the 40-hour basis.)
//
// Measured means there is something to compare: a contract, or at least one
// shift in the window. A member with neither - an owner who never works
// shifts - is left out of the average and gets 0, never a division by zero.
// A team of one, or a team whose average is 0, has deviations of 0.
//
// PURE: the window end is passed in. The engine reads no clock.

import { totalsByWorker, compareText } from './workerTotals.js';
import { activeWeeks } from './fairnessWindow.js';
import { positiveOr, sum } from './numbers.js';

/**
 * @param {object} input
 * @param {Array<{ membershipId: string, shiftTemplateId: string, startsAt: string, endsAt: string }>} input.assignments
 *        published assignments only - drafts are proposals, not work carried
 * @param {Array<{ membershipId: string, contractedHoursPerWeek?: number, joinedAt?: string }>} input.workers
 * @param {Array<{ id: string, category?: string, burdenWeight?: number }>} input.shiftTemplates
 * @param {{ weekendMultiplier?: number, referenceHours?: number }} input.policy
 * @param {{ startDate: string, endDate: string }} input.window  both ends inclusive
 * @param {string} input.timezone
 */
export function computeLedger({ assignments = [], workers = [], shiftTemplates = [], policy = {}, window, timezone }) {
  const team = uniqueSorted(workers);
  const totals = totalsByWorker({ assignments, workers: team, shiftTemplates, policy, window, timezone });
  const referenceHours = positiveOr(policy.referenceHours, 40);

  const measured = team.map((worker) => {
    const own = totals.get(worker.membershipId);
    const contracted = positiveOr(worker.contractedHoursPerWeek, 0);
    const weeklyHours = contracted > 0 ? contracted : referenceHours;
    const basisHours = weeklyHours * weeksHere(worker, own, window, timezone);
    const isMeasured = basisHours > 0 && (contracted > 0 || own.shiftsWorked > 0);

    return {
      membershipId: worker.membershipId,
      contractedHoursPerWeek: contracted,
      basisHours,
      measured: isMeasured,
      ...own,
      normalisedBurden: isMeasured ? (own.totalBurden / basisHours) * referenceHours : 0,
    };
  });

  const counted = measured.filter((row) => row.measured).map((row) => row.normalisedBurden);
  const teamAverage = counted.length > 0 ? sum(counted) / counted.length : 0;

  const rows = measured.map((row) => ({
    ...row,
    deviationPercent:
      row.measured && teamAverage > 0 ? ((row.normalisedBurden - teamAverage) / teamAverage) * 100 : 0,
  }));

  return { window, teamAverage, rows };
}

// Weeks of the window this person was in the team, counted from the day they
// joined. Someone recorded as joining only after the window, who still worked
// in it (a roster written for past dates), is measured over the whole window
// rather than not at all. Either way the answer never depends on how many
// shifts they took - which is what keeps an extra shift from lowering anyone.
function weeksHere(worker, own, window, timezone) {
  const weeks = activeWeeks(worker.joinedAt, window, timezone);
  if (weeks > 0 || own.shiftsWorked === 0) return weeks;
  return activeWeeks(undefined, window, timezone);
}

// One entry per member, sorted by id, whatever order they arrived in.
function uniqueSorted(workers) {
  const byId = new Map(workers.map((worker) => [worker.membershipId, worker]));
  return [...byId.values()].sort((a, b) => compareText(a.membershipId, b.membershipId));
}
