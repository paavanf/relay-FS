// generationProperties.test.js
// The headline invariant of the whole project, checked against hundreds of
// randomly generated organisations:
//
//   whatever the generator produces is legal.
//
// Not "usually legal", not "legal for the scenarios we thought of". If this
// ever fails, the software is producing rosters that break somebody's rest
// entitlement, and nothing else in Relay matters until it is fixed.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateRoster } from '../../../src/engine/scheduling/generateRoster.js';
import { construct } from '../../../src/engine/scheduling/construct.js';
import { improve } from '../../../src/engine/scheduling/improve.js';
import { expandDemand } from '../../../src/engine/scheduling/expandDemand.js';
import { scoreRoster } from '../../../src/engine/scheduling/objective.js';
import { resolveWeights } from '../../../src/engine/scheduling/weights.js';
import { createRandom } from '../../../src/engine/scheduling/random.js';
import { evaluate } from '../../../src/engine/constraints/evaluate.js';

const RUNS = 150;
const weights = resolveWeights();

const TEMPLATES = [
  { id: 't-day', name: 'Day', startLocal: '07:00', endLocal: '15:00', crossesMidnight: false, category: 'day', burdenWeight: 1 },
  { id: 't-eve', name: 'Evening', startLocal: '15:00', endLocal: '23:00', crossesMidnight: false, category: 'evening', burdenWeight: 1.3 },
  { id: 't-night', name: 'Night', startLocal: '23:00', endLocal: '07:00', crossesMidnight: true, category: 'night', burdenWeight: 1.8 },
];

const QUALIFICATIONS = [
  { id: 'RN', name: 'Registered Nurse' },
  { id: 'CN', name: 'Charge Nurse' },
];

// Deliberately spans easy and impossible: too few workers, or demand well
// past capacity, is exactly where a generator is tempted to cheat.
const scenarioArb = fc
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
      .map((w, i) => ({
        membershipId: w.membershipId,
        type: 'recurring',
        dayOfWeek: i % 7,
        shiftTemplateId: null,
        status: 'unavailable',
        date: null,
      }));

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
      rules: {
        minRestHours: raw.minRestHours,
        maxConsecutiveDays: raw.maxConsecutiveDays,
        maxHoursPerWeek: raw.maxHoursPerWeek,
      },
      timezone: raw.timezone,
      seed: raw.seed,
      maxIterations: 200,
    };
  });

const contextOf = (input) => ({
  workers: input.workers,
  shiftTemplates: input.shiftTemplates,
  availability: input.availability,
  coverage: input.coverageRequirements,
  rules: input.rules,
  timezone: input.timezone,
});

describe('generation properties', () => {
  it('every generated roster is legal', () => {
    fc.assert(
      fc.property(scenarioArb, (input) => {
        const result = generateRoster(input);
        const { isValid, hardViolations } = evaluate(result.assignments, contextOf(input));

        // Named so a failure says which rule was broken, not just "false".
        expect(hardViolations.map((v) => v.code)).toEqual([]);
        expect(isValid).toBe(true);
      }),
      { numRuns: RUNS },
    );
  });

  it('never throws, whatever the staffing', () => {
    fc.assert(
      fc.property(scenarioArb, (input) => {
        expect(() => generateRoster(input)).not.toThrow();
      }),
      { numRuns: RUNS },
    );
  });

  it('is deterministic for a given seed', () => {
    fc.assert(
      fc.property(scenarioArb, (input) => {
        expect(generateRoster(input).assignments).toEqual(generateRoster(input).assignments);
      }),
      { numRuns: RUNS },
    );
  });

  it('improvement never makes the objective worse than construction', () => {
    fc.assert(
      fc.property(scenarioArb, (input) => {
        const context = contextOf(input);
        const slots = expandDemand(input);
        const built = construct({ slots, context, weights });

        const before = scoreRoster({ ...built, context, weights }).score;
        const after = improve({
          ...built,
          slots,
          context,
          weights,
          random: createRandom(input.seed),
          maxIterations: input.maxIterations,
        });

        expect(after.objectiveScore).toBeLessThanOrEqual(before);
      }),
      { numRuns: RUNS },
    );
  });

  it('always terminates within the iteration cap', () => {
    fc.assert(
      fc.property(scenarioArb, (input) => {
        const result = generateRoster(input);
        expect(result.metrics.iterations).toBeLessThanOrEqual(input.maxIterations);
      }),
      { numRuns: RUNS },
    );
  });

  it('never fills a slot twice or invents one', () => {
    fc.assert(
      fc.property(scenarioArb, (input) => {
        const result = generateRoster(input);
        const slotIds = new Set(expandDemand(input).map((s) => s.slotId));

        const assignedIds = result.assignments.map((a) => a.id);
        expect(new Set(assignedIds).size).toBe(assignedIds.length);
        expect(assignedIds.every((id) => slotIds.has(id))).toBe(true);

        // Every slot is either filled or explained; none goes missing.
        expect(result.assignments.length + result.unfilledSlots.length).toBe(slotIds.size);
      }),
      { numRuns: RUNS },
    );
  });

  it('explains every slot it could not fill', () => {
    fc.assert(
      fc.property(scenarioArb, (input) => {
        for (const hole of generateRoster(input).unfilledSlots) {
          expect(typeof hole.reason).toBe('string');
          expect(hole.reason.length).toBeGreaterThan(20);
          expect(hole.slotId).toBeTruthy();
        }
      }),
      { numRuns: RUNS },
    );
  });
});
