// scenarioArbitraries.js
// The random organisations the property tests run against: a ward of 1-14
// people over 1-10 days, with qualifications, coverage, unavailability and
// rules all drawn at random - deliberately spanning easy and impossible.
//
// Shared by the generation properties (is every generated roster legal?)
// and the swap properties (is every swap found on such a roster legal?), so
// both are tested against the same worlds.

import fc from 'fast-check';

export const TEMPLATES = [
  { id: 't-day', name: 'Day', startLocal: '07:00', endLocal: '15:00', crossesMidnight: false, category: 'day', burdenWeight: 1 },
  { id: 't-eve', name: 'Evening', startLocal: '15:00', endLocal: '23:00', crossesMidnight: false, category: 'evening', burdenWeight: 1.3 },
  { id: 't-night', name: 'Night', startLocal: '23:00', endLocal: '07:00', crossesMidnight: true, category: 'night', burdenWeight: 1.8 },
];

export const QUALIFICATIONS = [
  { id: 'RN', name: 'Registered Nurse' },
  { id: 'CN', name: 'Charge Nurse' },
];

// Deliberately spans easy and impossible: too few workers, or demand well
// past capacity, is exactly where a generator is tempted to cheat.
export const scenarioArb = fc
  .record({
    workerCount: fc.integer({ min: 1, max: 14 }),
    days: fc.integer({ min: 1, max: 10 }),
    perShift: fc.integer({ min: 1, max: 3 }),
    templateCount: fc.integer({ min: 1, max: 3 }),
    chargeNurseEvery: fc.integer({ min: 1, max: 5 }),
    minRestHours: fc.integer({ min: 0, max: 14 }),
    maxConsecutiveDays: fc.integer({ min: 1, max: 7 }),
    maxHoursPerWeek: fc.integer({ min: 8, max: 60 }),
    timezone: fc.constantFrom('UTC', 'Europe/London', 'Asia/Kolkata', 'Australia/Sydney'),
    unavailableEvery: fc.integer({ min: 2, max: 6 }),
    seed: fc.integer({ min: 0, max: 100_000 }),
  })
  .map((raw) => {
    const workers = Array.from({ length: raw.workerCount }, (_, i) => ({
      membershipId: `w${i}`,
      qualificationIds: i % raw.chargeNurseEvery === 0 ? ['RN', 'CN'] : ['RN'],
      contractedHoursPerWeek: 37.5,
    }));

    const templates = TEMPLATES.slice(0, raw.templateCount);

    const coverageRequirements = [];
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek += 1) {
      for (const template of templates) {
        coverageRequirements.push({
          shiftTemplateId: template.id,
          dayOfWeek,
          requirements: [
            { qualificationId: 'RN', count: raw.perShift },
            ...(dayOfWeek % 2 === 0 ? [{ qualificationId: 'CN', count: 1 }] : []),
          ],
        });
      }
    }

    // Some people refuse some days, which is what makes slots genuinely hard.
    const availability = workers
      .filter((_, i) => i % raw.unavailableEvery === 0)
      .map((w, i) => ({ membershipId: w.membershipId, type: 'recurring', dayOfWeek: i % 7, shiftTemplateId: null, status: 'unavailable', date: null }));

    const start = new Date(Date.UTC(2026, 2, 2));
    const end = new Date(start.getTime() + (raw.days - 1) * 86_400_000);

    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      workers,
      shiftTemplates: templates,
      qualifications: QUALIFICATIONS,
      coverageRequirements,
      availability,
      rules: { minRestHours: raw.minRestHours, maxConsecutiveDays: raw.maxConsecutiveDays, maxHoursPerWeek: raw.maxHoursPerWeek },
      timezone: raw.timezone,
      seed: raw.seed,
      maxIterations: 200,
    };
  });

export const contextOf = (input) => ({
  workers: input.workers,
  shiftTemplates: input.shiftTemplates,
  availability: input.availability,
  coverage: input.coverageRequirements,
  rules: input.rules,
  timezone: input.timezone,
});
