// build.js
// Fixture builders for the generation tests. Plain objects only - the
// scheduling engine takes no database, so neither do its tests.

export const TZ = 'Europe/London';

export const DAY = {
  id: 't-day', name: 'Day', startLocal: '07:00', endLocal: '15:00',
  crossesMidnight: false, category: 'day', burdenWeight: 1,
};
export const EVENING = {
  id: 't-eve', name: 'Evening', startLocal: '15:00', endLocal: '23:00',
  crossesMidnight: false, category: 'evening', burdenWeight: 1.3,
};
export const NIGHT = {
  id: 't-night', name: 'Night', startLocal: '23:00', endLocal: '07:00',
  crossesMidnight: true, category: 'night', burdenWeight: 1.8,
};

export const QUALIFICATIONS = [
  { id: 'RN', name: 'Registered Nurse' },
  { id: 'CN', name: 'Charge Nurse' },
];

export function workers(count, qualificationIds = ['RN']) {
  return Array.from({ length: count }, (_, i) => ({
    membershipId: `w${i}`,
    qualificationIds,
    contractedHoursPerWeek: 37.5,
  }));
}

/** A coverage rule for every day of the week. */
export function everyDay(shiftTemplateId, requirements) {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    shiftTemplateId,
    dayOfWeek,
    requirements,
  }));
}

export function scenario(overrides = {}) {
  return {
    startDate: '2026-03-02',
    endDate: '2026-03-08',
    workers: workers(10),
    shiftTemplates: [DAY, EVENING, NIGHT],
    qualifications: QUALIFICATIONS,
    coverageRequirements: everyDay('t-day', [{ qualificationId: 'RN', count: 2 }]),
    availability: [],
    rules: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 48 },
    timezone: TZ,
    seed: 42,
    maxIterations: 300,
    ...overrides,
  };
}

/** The shape the constraint engine expects, built from a scenario. */
export function contextOf(input) {
  return {
    workers: input.workers,
    shiftTemplates: input.shiftTemplates,
    availability: input.availability,
    coverage: input.coverageRequirements,
    rules: input.rules,
    timezone: input.timezone,
    fairnessDebt: input.fairnessDebt,
  };
}

/** A clock that advances a fixed amount per read, so time is deterministic. */
export function fakeClock(stepMs = 1) {
  let value = 0;
  return () => {
    value += stepMs;
    return value;
  };
}
