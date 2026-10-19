// swapBenchmarkWards.js
// The wards benchmark-swaps.js measures, each rostered once by the real
// generator. Pure computation over engine output - nothing here touches a
// database or the network.
//
// Written down before the first run, and not to be tuned after seeing the
// results (the README repeats them):
//
//   the evaluation harness's wards, as they are: the 40-person hospital ward,
//   the ward with heavy availability constraints, and the understaffed one
//
//   the mixed-role ward: 40 people - 8 charge nurses (who are also registered
//   nurses), 16 registered nurses and 16 healthcare assistants - where every
//   shift needs particular roles: Day 1 CN + 3 RN + 3 HCA, Evening 1 CN +
//   2 RN + 2 HCA, Night 1 CN + 1 RN + 2 HCA. Same shifts, rules, dates and
//   timezone as the harness's 40-person ward; no declared availability.
//
//   for the performance target: the hospital ward with 100 staff and its
//   demand scaled up 2.5 times, with fairness debts and preferences to rank by

import { generateRoster } from '../src/engine/index.js';
import { SCENARIOS, SEED, MAX_ITERATIONS, staff, everyDay } from './scenarios.js';

const scenario = (prefix) => SCENARIOS.find((s) => s.name.startsWith(prefix));
const people = (prefix, count, qualificationIds) =>
  Array.from({ length: count }, (_, i) => ({ membershipId: `${prefix}${i}`, qualificationIds, contractedHoursPerWeek: 37.5 }));
const needs = (cn, rn, hca) => [
  { qualificationId: 'CN', count: cn },
  { qualificationId: 'RN', count: rn },
  { qualificationId: 'HCA', count: hca },
];

export const WARDS = [scenario('Hospital ward'), scenario('Ward with heavy availability'), scenario('Understaffed ward')];

export const MIXED_WARD = {
  ...scenario('Hospital ward'),
  name: 'Mixed-role ward (40 staff, 14 days)',
  workers: [...people('cn', 8, ['CN', 'RN']), ...people('rn', 16, ['RN']), ...people('hca', 16, ['HCA'])],
  coverageRequirements: everyDay({ 't-day': needs(1, 3, 3), 't-eve': needs(1, 2, 2), 't-night': needs(1, 1, 2) }),
  availability: [],
};

export const LARGE_WARD = {
  ...scenario('Hospital ward'),
  name: 'Hospital ward (100 staff, 14 days)',
  workers: staff(100),
  coverageRequirements: everyDay({
    't-day': [{ qualificationId: 'RN', count: 10 }, { qualificationId: 'CN', count: 3 }],
    't-eve': [{ qualificationId: 'RN', count: 8 }, { qualificationId: 'CN', count: 2 }],
    't-night': [{ qualificationId: 'RN', count: 5 }, { qualificationId: 'CN', count: 2 }],
  }),
};

/** The ward rostered once by the real generator: fixed seed, iteration cap, no clock. */
export function rosterFor(ward) {
  return generateRoster({ ...ward, seed: SEED, maxIterations: MAX_ITERATIONS }).assignments;
}

/** What the constraint engine checks a swap against - the shape the app builds. */
export function contextOf(ward) {
  return {
    workers: ward.workers,
    shiftTemplates: ward.shiftTemplates,
    availability: ward.availability,
    coverage: ward.coverageRequirements,
    rules: ward.rules,
    timezone: ward.timezone,
  };
}

/**
 * The ward with something for the ranking to weigh, as a team with history
 * would have: a fairness debt for everyone (seeded, -6 to +6) and a third of
 * the team preferring one weekday. Neither changes what is legal, but both
 * make the search's ranking bound weaker - the harder case for its speed.
 */
export function withRankingData(ward, random) {
  const prefer = ward.workers
    .filter((_, i) => i % 3 === 0)
    .map((w, i) => ({ membershipId: w.membershipId, type: 'recurring', dayOfWeek: i % 7, shiftTemplateId: null, status: 'prefer', date: null }));
  return {
    context: { ...contextOf(ward), availability: [...ward.availability, ...prefer] },
    fairnessDebt: Object.fromEntries(ward.workers.map((w) => [w.membershipId, Math.round((random() * 12 - 6) * 10) / 10])),
  };
}
