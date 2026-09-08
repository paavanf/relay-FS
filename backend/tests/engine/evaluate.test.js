// evaluate.test.js
// The single entry point, and the promise that it never throws no matter what
// it is handed - the generator, a live-typing UI and a search loop all call it
// and none of them can usefully catch.

import { describe, it, expect } from 'vitest';
import { evaluate, canAssign } from '../../src/engine/index.js';
import { context, localShift, availability, worker, coverage, codesOf } from './helpers/build.js';

const ctx = context({ rules: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 40 } });

describe('evaluate', () => {
  it('calls an empty roster valid', () => {
    const result = evaluate([], ctx);
    expect(result.isValid).toBe(true);
    expect(result.hardViolations).toEqual([]);
    expect(result.softScore).toBe(0);
  });

  it('calls a clean roster valid', () => {
    const shifts = [
      localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', date: '2026-03-04', start: '09:00', end: '17:00' }),
    ];
    expect(evaluate(shifts, ctx).isValid).toBe(true);
  });

  it('collects violations from every hard constraint at once', () => {
    const shifts = [
      localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', date: '2026-03-02', start: '16:00', end: '23:00' }),
    ];

    const codes = codesOf(evaluate(shifts, ctx).hardViolations);
    expect(codes).toContain('DOUBLE_BOOKED');
    expect(codes).toContain('MIN_REST');
  });

  it('ties isValid to the presence of hard violations', () => {
    const shifts = [
      localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', date: '2026-03-02', start: '17:00', end: '22:00' }),
    ];

    const result = evaluate(shifts, ctx);
    expect(result.isValid).toBe(result.hardViolations.length === 0);
    expect(result.isValid).toBe(false);
  });

  it('sums soft penalties into the score', () => {
    const soft = context({
      availability: [availability({ type: 'recurring', dayOfWeek: 1, status: 'avoid' })],
    });
    const shifts = [localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' })];

    const result = evaluate(shifts, soft);
    expect(result.isValid).toBe(true); // avoid is advisory, not binding
    expect(result.softScore).toBeGreaterThan(0);
    expect(result.softScore).toBe(result.softPenalties.reduce((s, p) => s + p.penalty, 0));
  });

  it('is deterministic', () => {
    const shifts = [
      localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', date: '2026-03-02', start: '17:00', end: '22:00' }),
    ];
    expect(evaluate(shifts, ctx)).toEqual(evaluate(shifts, ctx));
  });

  it('does not depend on the order of the assignments', () => {
    const a = localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' });
    const b = localShift({ id: 'b', date: '2026-03-02', start: '17:00', end: '22:00' });

    const forwards = evaluate([a, b], ctx);
    const backwards = evaluate([b, a], ctx);
    expect(forwards.isValid).toBe(backwards.isValid);
    expect(codesOf(forwards.hardViolations).sort()).toEqual(codesOf(backwards.hardViolations).sort());
  });

  describe('defensive behaviour', () => {
    const bad = [
      ['null assignments', null],
      ['a string instead of an array', 'nope'],
      ['an array of nulls', [null, undefined]],
      ['assignments missing instants', [{ id: 'a', membershipId: 'w1' }]],
      ['an unparseable instant', [{ id: 'a', membershipId: 'w1', startsAt: 'soon', endsAt: 'later' }]],
      [
        'a shift ending before it starts',
        [
          {
            id: 'a',
            membershipId: 'w1',
            shiftTemplateId: 't',
            startsAt: '2026-03-02T10:00:00Z',
            endsAt: '2026-03-02T09:00:00Z',
          },
        ],
      ],
    ];

    for (const [label, assignments] of bad) {
      it(`does not throw on ${label}`, () => {
        expect(() => evaluate(assignments, ctx)).not.toThrow();
      });
    }

    it('reports a malformed assignment rather than ignoring it', () => {
      const result = evaluate([{ id: 'a', membershipId: 'w1', startsAt: 'soon', endsAt: 'later' }], ctx);
      expect(codesOf(result.hardViolations)).toEqual(['MALFORMED_ASSIGNMENT']);
      expect(result.isValid).toBe(false);
    });

    it('survives a missing context entirely', () => {
      expect(() => evaluate([], undefined)).not.toThrow();
      expect(evaluate([], undefined).isValid).toBe(true);
    });

    it('falls back to UTC on an unusable timezone', () => {
      const broken = context({ timezone: 'Mars/Olympus_Mons' });
      const shifts = [localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' })];
      expect(() => evaluate(shifts, broken)).not.toThrow();
    });

    it('sits out rules that were never configured', () => {
      const noRules = context({ rules: {} });
      const shifts = [
        localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
        localShift({ id: 'b', date: '2026-03-02', start: '17:00', end: '22:00' }),
      ];
      // Overlap would still be caught, but no rest or hours rule exists.
      expect(codesOf(evaluate(shifts, noRules).hardViolations)).toEqual([]);
    });
  });
});

describe('canAssign', () => {
  const existing = [localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' })];

  it('allows a clean addition', () => {
    const candidate = localShift({ id: 'b', date: '2026-03-04', start: '09:00', end: '17:00' });
    expect(canAssign(candidate, existing, ctx)).toEqual({ allowed: true, violations: [] });
  });

  it('refuses one that breaks a rule, and says which', () => {
    const candidate = localShift({ id: 'b', date: '2026-03-02', start: '18:00', end: '22:00' });

    const result = canAssign(candidate, existing, ctx);
    expect(result.allowed).toBe(false);
    expect(codesOf(result.violations)).toContain('MIN_REST');
  });

  it('reports only the violations involving the candidate', () => {
    // The existing roster is already broken between a and b.
    const broken = [
      localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', date: '2026-03-02', start: '17:00', end: '22:00' }),
    ];
    const candidate = localShift({ id: 'c', date: '2026-03-10', start: '09:00', end: '17:00' });

    const result = canAssign(candidate, broken, ctx);
    expect(result.allowed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('works against an empty roster', () => {
    const candidate = localShift({ id: 'b', date: '2026-03-04', start: '09:00', end: '17:00' });
    expect(canAssign(candidate, [], ctx).allowed).toBe(true);
  });

  it('handles a candidate that has no id yet', () => {
    const { id: _id, ...withoutId } = localShift({
      id: 'temp',
      date: '2026-03-02',
      start: '18:00',
      end: '22:00',
    });

    const result = canAssign(withoutId, existing, ctx);
    expect(result.allowed).toBe(false);
    expect(codesOf(result.violations)).toContain('MIN_REST');
  });

  it('refuses a candidate that is not an assignment at all', () => {
    expect(canAssign(null, existing, ctx).allowed).toBe(false);
    expect(canAssign('nope', existing, ctx).allowed).toBe(false);
  });

  it('agrees with evaluate', () => {
    const candidate = localShift({ id: 'b', date: '2026-03-02', start: '18:00', end: '22:00' });

    const viaCanAssign = canAssign(candidate, existing, ctx);
    const combined = evaluate([...existing, candidate], ctx);
    const involving = combined.hardViolations.filter((v) => v.assignmentIds.includes('b'));

    expect(viaCanAssign.violations).toEqual(involving);
  });

  it('catches an unqualified candidate', () => {
    const qualified = context({
      workers: [worker('w1', ['CLEANER'])],
      coverage: [coverage('t-day', 1, [{ qualificationId: 'RN', count: 1 }])],
    });
    const candidate = localShift({ id: 'b', date: '2026-03-02', start: '09:00', end: '17:00' });

    expect(codesOf(canAssign(candidate, [], qualified).violations)).toEqual([
      'QUALIFICATION_MISMATCH',
    ]);
  });
});
