// canAssign.test.js
// canAssign(): would adding this one assignment break a rule? Only the
// violations involving the candidate are reported, it works against an empty
// roster and a candidate with no id yet, and it agrees with evaluate().
//
// The single entry point never throws, whatever it is handed - the generator,
// a live-typing UI and a search loop all call it, and none of them can
// usefully catch.

import { describe, it, expect } from 'vitest';
import { evaluate, canAssign } from '../../src/engine/index.js';
import { context, localShift, worker, coverage, codesOf } from './helpers/build.js';

const ctx = context({ rules: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 40 } });

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
