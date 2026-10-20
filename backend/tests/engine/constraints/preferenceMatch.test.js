// preferenceMatch.test.js
// Preferences score, they never block: working an avoided day costs, an
// unmet preference costs, a met one does not.

import { describe, it, expect } from 'vitest';
import { scorePreferenceMatch } from '../../../src/engine/constraints/soft/preferenceMatch.js';
import { context, localShift, availability, codesOf } from '../helpers/build.js';

const MONDAY = '2026-03-02';
const MONDAY_DOW = 1;
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
});
