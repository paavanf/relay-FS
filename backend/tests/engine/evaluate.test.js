// evaluate.test.js
// evaluate(): empty and clean rosters are valid, every hard constraint is
// collected at once, soft penalties add up to the score, and the answer is
// the same whatever order the assignments come in. Malformed input is
// evaluateDefensive.test.js; canAssign() is canAssign.test.js.
//
// The single entry point never throws, whatever it is handed - the generator,
// a live-typing UI and a search loop all call it, and none of them can
// usefully catch.

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../src/engine/index.js';
import { context, localShift, availability, codesOf } from './helpers/build.js';

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
});
