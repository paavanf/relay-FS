// evaluateDefensive.test.js
// evaluate() handed nonsense: null, strings, nulls, missing or unparseable
// instants, a shift ending before it starts, no context at all, an unusable
// timezone, rules never configured. It reports what it can and never throws.
//
// The single entry point never throws, whatever it is handed - the generator,
// a live-typing UI and a search loop all call it, and none of them can
// usefully catch.

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../src/engine/index.js';
import { context, localShift, codesOf } from './helpers/build.js';

const ctx = context({ rules: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 40 } });

describe('evaluate', () => {
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
