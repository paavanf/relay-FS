// engineProperties.test.js
// Invariants that must hold for EVERY structurally valid input, checked
// against hundreds of randomly generated cases each.
//
// These catch the cases nobody thinks to write by hand: the shift that starts
// exactly when another ends, in a half-hour timezone, on the night the clocks
// change, for a worker who also has three other shifts that week.
//
// Generators build assignments from an offset and a duration in minutes rather
// than from ISO strings, so every generated instant is real and every shift
// has a positive length. Ids are assigned by index, which is what keeps them
// unique - two assignments sharing an id would make the violation reports
// ambiguous and the properties meaningless.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { DateTime } from 'luxon';
import { evaluate, canAssign } from '../../../src/engine/index.js';

const RUNS = 500;

const BASE = DateTime.fromISO('2026-03-01T00:00:00Z', { zone: 'utc' });
const MEMBERSHIP_IDS = ['w1', 'w2', 'w3'];
const TEMPLATE_IDS = ['t-day', 't-eve', 't-night'];
const QUALIFICATION_IDS = ['RN', 'CN', 'HCA'];

// A deliberately awkward set: a half-hour offset, two DST zones with opposite
// hemispheres, and one 45-minute offset.
const TIMEZONES = ['UTC', 'Asia/Kolkata', 'America/New_York', 'Australia/Sydney', 'Pacific/Chatham'];

const rawAssignment = fc.record({
  membershipId: fc.constantFrom(...MEMBERSHIP_IDS),
  shiftTemplateId: fc.constantFrom(...TEMPLATE_IDS),
  startOffsetMinutes: fc.integer({ min: 0, max: 60 * 24 * 21 }),
  durationMinutes: fc.integer({ min: 30, max: 60 * 14 }),
});

function toAssignment(raw, index) {
  const startsAt = BASE.plus({ minutes: raw.startOffsetMinutes });
  const endsAt = startsAt.plus({ minutes: raw.durationMinutes });

  return {
    id: `a${index}`,
    membershipId: raw.membershipId,
    shiftTemplateId: raw.shiftTemplateId,
    date: startsAt.toISODate(),
    startsAt: startsAt.toISO(),
    endsAt: endsAt.toISO(),
  };
}

const assignmentsArb = fc
  .array(rawAssignment, { maxLength: 10 })
  .map((raws) => raws.map(toAssignment));

const availabilityArb = fc.record({
  membershipId: fc.constantFrom(...MEMBERSHIP_IDS),
  type: fc.constantFrom('recurring', 'exception'),
  dayOfWeek: fc.integer({ min: 0, max: 6 }),
  date: fc
    .integer({ min: 0, max: 21 })
    .map((d) => BASE.plus({ days: d }).toISODate()),
  shiftTemplateId: fc.option(fc.constantFrom(...TEMPLATE_IDS), { nil: null }),
  status: fc.constantFrom('unavailable', 'prefer', 'avoid'),
});

const coverageArb = fc.record({
  shiftTemplateId: fc.constantFrom(...TEMPLATE_IDS),
  dayOfWeek: fc.integer({ min: 0, max: 6 }),
  requirements: fc.array(
    fc.record({
      qualificationId: fc.constantFrom(...QUALIFICATION_IDS),
      count: fc.integer({ min: 1, max: 4 }),
    }),
    { maxLength: 3 },
  ),
});

const contextArb = fc.record({
  workers: fc.constant(
    MEMBERSHIP_IDS.map((membershipId) => ({
      membershipId,
      qualificationIds: [],
      contractedHoursPerWeek: 37.5,
    })),
  ),
  shiftTemplates: fc.constant(
    TEMPLATE_IDS.map((id, i) => ({
      id,
      startLocal: '09:00',
      endLocal: '17:00',
      crossesMidnight: false,
      category: ['day', 'evening', 'night'][i],
      burdenWeight: 1 + i * 0.5,
    })),
  ),
  availability: fc.array(availabilityArb, { maxLength: 6 }),
  coverage: fc.array(coverageArb, { maxLength: 4 }),
  rules: fc.record({
    minRestHours: fc.integer({ min: 0, max: 16 }),
    maxConsecutiveDays: fc.integer({ min: 1, max: 7 }),
    maxHoursPerWeek: fc.integer({ min: 8, max: 60 }),
  }),
  timezone: fc.constantFrom(...TIMEZONES),
});

// A violation's identity for comparison purposes. The exact assignmentIds can
// legitimately change when a shift is removed - if B sat between A and C, the
// rest check moves from (A,B) to (A,C) - so identity is the rule that was
// broken and who broke it.
const identity = (v) => `${v.code}|${v.membershipId}`;

describe('engine properties', () => {
  it('is deterministic - the same input always gives the same output', () => {
    fc.assert(
      fc.property(assignmentsArb, contextArb, (assignments, context) => {
        expect(evaluate(assignments, context)).toEqual(evaluate(assignments, context));
      }),
      { numRuns: RUNS },
    );
  });

  it('never throws on structurally valid input', () => {
    fc.assert(
      fc.property(assignmentsArb, contextArb, (assignments, context) => {
        expect(() => evaluate(assignments, context)).not.toThrow();
      }),
      { numRuns: RUNS },
    );
  });

  it('reports isValid if and only if there are no hard violations', () => {
    fc.assert(
      fc.property(assignmentsArb, contextArb, (assignments, context) => {
        const result = evaluate(assignments, context);
        expect(result.isValid).toBe(result.hardViolations.length === 0);
      }),
      { numRuns: RUNS },
    );
  });

  it('always calls an empty assignment set valid', () => {
    fc.assert(
      fc.property(contextArb, (context) => {
        const result = evaluate([], context);
        expect(result.isValid).toBe(true);
        expect(result.hardViolations).toEqual([]);
        expect(result.softScore).toBe(0);
      }),
      { numRuns: RUNS },
    );
  });

  it('never introduces a new hard violation when an assignment is removed', () => {
    fc.assert(
      fc.property(assignmentsArb, contextArb, fc.nat(), (assignments, context, seed) => {
        fc.pre(assignments.length > 0);

        const index = seed % assignments.length;
        const fewer = assignments.filter((_, i) => i !== index);

        const before = new Set(evaluate(assignments, context).hardViolations.map(identity));
        const after = evaluate(fewer, context).hardViolations.map(identity);

        for (const violation of after) {
          expect(before.has(violation)).toBe(true);
        }
      }),
      { numRuns: RUNS },
    );
  });

  it('agrees between canAssign and evaluate', () => {
    fc.assert(
      fc.property(assignmentsArb, contextArb, (assignments, context) => {
        fc.pre(assignments.length > 0);

        const candidate = assignments[assignments.length - 1];
        const existing = assignments.slice(0, -1);

        const { allowed } = canAssign(candidate, existing, context);
        const involving = evaluate(assignments, context).hardViolations.filter((v) =>
          v.assignmentIds.includes(candidate.id),
        );

        // Allowed means, precisely, that nothing involving the candidate fired.
        expect(allowed).toBe(involving.length === 0);
      }),
      { numRuns: RUNS },
    );
  });

  it('does not depend on the order the assignments arrive in', () => {
    fc.assert(
      fc.property(
        assignmentsArb.chain((assignments) =>
          fc.tuple(
            fc.constant(assignments),
            fc.shuffledSubarray(assignments, {
              minLength: assignments.length,
              maxLength: assignments.length,
            }),
          ),
        ),
        contextArb,
        ([original, shuffled], context) => {
          const a = evaluate(original, context);
          const b = evaluate(shuffled, context);

          expect(b.isValid).toBe(a.isValid);
          expect(b.hardViolations.map(identity).sort()).toEqual(
            a.hardViolations.map(identity).sort(),
          );
          expect(b.softScore).toBeCloseTo(a.softScore, 9);
        },
      ),
      { numRuns: RUNS },
    );
  });
});
