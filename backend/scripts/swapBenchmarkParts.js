// swapBenchmarkParts.js
// Helpers for benchmark-swaps.js: the wards, one roster for each, and random
// pools of offers. (The table's arithmetic is in swapBenchmarkReport.js.)
//
// Pure computation over engine output - nothing here touches a database or
// the network. Pools come from a seeded generator, so every run asks exactly
// the same questions and only the timings move.

import { generateRoster } from '../src/engine/index.js';
import { SCENARIOS, SEED, MAX_ITERATIONS, staff, everyDay } from './scenarios.js';

const scenario = (prefix) => SCENARIOS.find((s) => s.name.startsWith(prefix));

// The evaluation harness's wards, exactly as they are: the two 40-person
// ones, and the understaffed one - 12 people doing 40 people's work, all at
// their limits - as the contrast that shows when chains can and cannot help.
export const WARDS = [scenario('Hospital ward'), scenario('Ward with heavy availability'), scenario('Understaffed ward')];

// For the performance target: the same ward with 100 staff, and its demand
// scaled up 2.5 times (12 people a day becomes 30) so they are about as busy.
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
 * Seeded random numbers in [0, 1) - mulberry32, the same small generator the
 * roster generator uses. Kept here so this script needs nothing from inside
 * the engine beyond its public API.
 */
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `size` different people with shifts, each offering one of their own at random. */
export function poolOf(assignments, size, random) {
  const shiftsOf = new Map();
  for (const a of assignments) shiftsOf.set(a.membershipId, [...(shiftsOf.get(a.membershipId) ?? []), a]);
  const people = [...shiftsOf.keys()].sort();

  // A partial Fisher-Yates shuffle: the first `size` places, no repeats.
  for (let i = 0; i < Math.min(size, people.length); i += 1) {
    const j = i + Math.floor(random() * (people.length - i));
    [people[i], people[j]] = [people[j], people[i]];
  }

  return people.slice(0, size).map((membershipId) => {
    const own = shiftsOf.get(membershipId);
    const shift = own[Math.floor(random() * own.length)];
    return { id: `offer:${shift.id}`, membershipId, assignmentId: shift.id };
  });
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
