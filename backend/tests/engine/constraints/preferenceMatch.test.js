// preferenceMatch.test.js
// Preferences score, they never block. The case worth pinning down is that an
// unmet preference only counts when the roster actually covers that day.

import { describe, it, expect } from 'vitest';
import { scorePreferenceMatch } from '../../../src/engine/constraints/soft/preferenceMatch.js';
import { context, localShift, availability, codesOf } from '../helpers/build.js';

const MONDAY = '2026-03-02';
const MONDAY_DOW = 1;
const TUESDAY_DOW = 2;

const monday = localShift({ id: 'a', date: MONDAY, start: '09:00', end: '17:00' });

describe('scorePreferenceMatch', () => {
  it('scores nothing on an empty set', () => {
    expect(scorePreferenceMatch([], context())).toEqual([]);
  });

  it('scores nothing when no preferences were expressed', () => {
    expect(scorePreferenceMatch([monday], context())).toEqual([]);
  });

  it('penalises working a day marked avoid', () => {
    const ctx = context({
      availability: [availability({ type: 'recurring', dayOfWeek: MONDAY_DOW, status: 'avoid' })],
    });

    const penalties = scorePreferenceMatch([monday], ctx);
    expect(codesOf(penalties)).toEqual(['AVOIDED_SHIFT']);
    expect(penalties[0].penalty).toBeGreaterThan(0);
    expect(penalties[0].assignmentIds).toEqual(['a']);
  });

  it('penalises a preference that went unmet', () => {
    // They asked for Mondays and the roster covers a Monday, but they were
    // not given one.
    const someoneElsesMonday = { ...monday, id: 'b', membershipId: 'w2' };
    const ctx = context({
      availability: [availability({ type: 'recurring', dayOfWeek: MONDAY_DOW, status: 'prefer' })],
    });

    expect(codesOf(scorePreferenceMatch([someoneElsesMonday], ctx))).toEqual(['UNMET_PREFERENCE']);
  });

  it('does not penalise a preference that was met', () => {
    const ctx = context({
      availability: [availability({ type: 'recurring', dayOfWeek: MONDAY_DOW, status: 'prefer' })],
    });
    expect(scorePreferenceMatch([monday], ctx)).toEqual([]);
  });

  it('does not penalise a preference for a day the roster never covers', () => {
    // They prefer Tuesdays; this roster is a single Monday. Marking that
    // unmet would make every short roster look bad for no reason.
    const ctx = context({
      availability: [availability({ type: 'recurring', dayOfWeek: TUESDAY_DOW, status: 'prefer' })],
    });
    expect(scorePreferenceMatch([monday], ctx)).toEqual([]);
  });

  it('does penalise a preference for a weekday the roster does cover', () => {
    // A full week of somebody else's shifts covers every weekday.
    const week = Array.from({ length: 7 }, (_, i) =>
      localShift({
        id: `x${i}`,
        membershipId: 'w2',
        date: `2026-03-0${2 + i}`,
        start: '09:00',
        end: '17:00',
      }),
    );
    const ctx = context({
      availability: [availability({ type: 'recurring', dayOfWeek: TUESDAY_DOW, status: 'prefer' })],
    });
    expect(codesOf(scorePreferenceMatch(week, ctx))).toEqual(['UNMET_PREFERENCE']);
  });

  it('ignores an exception preference outside the roster period', () => {
    const ctx = context({
      availability: [availability({ type: 'exception', date: '2026-06-01', status: 'prefer' })],
    });
    expect(scorePreferenceMatch([monday], ctx)).toEqual([]);
  });

  it('weighs an avoided shift more heavily than an unmet preference', () => {
    const avoidCtx = context({
      availability: [availability({ type: 'recurring', dayOfWeek: MONDAY_DOW, status: 'avoid' })],
    });
    const preferCtx = context({
      availability: [availability({ type: 'recurring', dayOfWeek: MONDAY_DOW, status: 'prefer' })],
    });

    const avoided = scorePreferenceMatch([monday], avoidCtx)[0].penalty;
    const unmet = scorePreferenceMatch([{ ...monday, membershipId: 'w2' }], preferCtx)[0].penalty;
    expect(avoided).toBeGreaterThan(unmet);
  });

  it('respects the shift template scope of an avoid', () => {
    const ctx = context({
      availability: [
        availability({
          type: 'recurring',
          dayOfWeek: MONDAY_DOW,
          status: 'avoid',
          shiftTemplateId: 't-night',
        }),
      ],
    });
    // The assignment is on t-day, so the night-scoped avoid does not apply.
    expect(scorePreferenceMatch([monday], ctx)).toEqual([]);
  });
});
