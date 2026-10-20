// scenarios.js
// Fixed, realistic inputs for the generation harness.
//
// Defined in code rather than loaded from anywhere: the whole point is that
// the numbers are comparable between runs, so the data cannot be allowed to
// drift. Nothing here touches a database or the network.

// Shared by evaluate-generation.js and export-landing-fixture.js, so the
// numbers printed by `npm run evaluate` and the landing-page demo come from
// identical runs. Change them here and both move together. The swap
// benchmark (benchmark-swaps.js) builds its wards from the same staff and
// rules, which live in scenarioParts.js.
export const SEED = 20260309;
export const MAX_ITERATIONS = 4000;

import { DAY, EVE, NIGHT, QUALS, WARD_RULES, staff, everyDay } from './scenarioParts.js';

// The swap benchmark (swapBenchmarkWards.js) builds its wards from these too.
export { staff, everyDay };

export const SCENARIOS = [
  {
    name: 'Hospital ward (40 staff, 14 days)',
    startDate: '2026-03-02',
    endDate: '2026-03-15',
    workers: staff(40),
    shiftTemplates: [DAY, EVE, NIGHT],
    qualifications: QUALS,
    coverageRequirements: WARD_RULES,
    availability: [],
    rules: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 48 },
    timezone: 'Europe/London',
  },
  {
    name: 'Ward with heavy availability constraints',
    startDate: '2026-03-02',
    endDate: '2026-03-15',
    workers: staff(40),
    shiftTemplates: [DAY, EVE, NIGHT],
    qualifications: QUALS,
    coverageRequirements: WARD_RULES,
    // Half the team refuses nights outright; a third avoids weekends.
    // A recurring entry names one weekday (the app refuses one without), so
    // "never nights" is seven of them, as a worker would enter it.
    availability: [
      ...staff(40)
        .filter((_, i) => i % 2 === 0)
        .flatMap((w) => [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({ membershipId: w.membershipId, type: 'recurring', dayOfWeek, shiftTemplateId: 't-night', status: 'unavailable', date: null }))),
      ...staff(40)
        .filter((_, i) => i % 3 === 0)
        .flatMap((w) => [0, 6].map((dayOfWeek) => ({ membershipId: w.membershipId, type: 'recurring', dayOfWeek, shiftTemplateId: null, status: 'avoid', date: null }))),
    ],
    rules: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 48 },
    timezone: 'Europe/London',
  },
  {
    name: 'Understaffed ward (infeasible on purpose)',
    startDate: '2026-03-02',
    endDate: '2026-03-15',
    // Same demand as the full ward, a third of the people.
    workers: staff(12),
    shiftTemplates: [DAY, EVE, NIGHT],
    qualifications: QUALS,
    coverageRequirements: WARD_RULES,
    availability: [],
    rules: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 48 },
    timezone: 'Europe/London',
  },
  {
    name: 'Small cafe (8 staff, 7 days)',
    startDate: '2026-03-02',
    endDate: '2026-03-08',
    workers: staff(8, 'c'),
    shiftTemplates: [DAY, EVE],
    qualifications: QUALS,
    coverageRequirements: everyDay({
      't-day': [{ qualificationId: 'RN', count: 2 }],
      't-eve': [{ qualificationId: 'RN', count: 2 }],
    }),
    availability: [],
    rules: { minRestHours: 10, maxConsecutiveDays: 6, maxHoursPerWeek: 40 },
    timezone: 'Asia/Kolkata',
  },
  {
    name: 'Ward across a DST change (28 days)',
    // British clocks go forward on 2026-03-29, inside this range.
    startDate: '2026-03-16',
    endDate: '2026-04-12',
    workers: staff(40),
    shiftTemplates: [DAY, EVE, NIGHT],
    qualifications: QUALS,
    coverageRequirements: WARD_RULES,
    availability: [],
    rules: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 48 },
    timezone: 'Europe/London',
  },
];
