// patternContinuity.test.js
// Runs of the same shift category score better than alternating ones. Only
// consecutive days count - a day off in between is when people adjust.

import { describe, it, expect } from 'vitest';
import { scorePatternContinuity } from '../../../src/engine/constraints/soft/patternContinuity.js';
import { context, localShift, template, codesOf } from '../helpers/build.js';

const ctx = context({
  shiftTemplates: [template('t-day', 'day'), template('t-night', 'night')],
});

function on(date, shiftTemplateId, id = date) {
  return localShift({ id, shiftTemplateId, date, start: '09:00', end: '17:00' });
}

describe('scorePatternContinuity', () => {
  it('scores nothing on an empty set', () => {
    expect(scorePatternContinuity([], ctx)).toEqual([]);
  });

  it('scores nothing for a single day', () => {
    expect(scorePatternContinuity([on('2026-03-02', 't-day')], ctx)).toEqual([]);
  });

  it('scores nothing for a run of the same category', () => {
    const shifts = [
      on('2026-03-02', 't-night'),
      on('2026-03-03', 't-night'),
      on('2026-03-04', 't-night'),
    ];
    expect(scorePatternContinuity(shifts, ctx)).toEqual([]);
  });

  it('penalises switching category on consecutive days', () => {
    const shifts = [on('2026-03-02', 't-day'), on('2026-03-03', 't-night')];

    const penalties = scorePatternContinuity(shifts, ctx);
    expect(codesOf(penalties)).toEqual(['CATEGORY_SWITCH']);
    expect(penalties[0].penalty).toBeGreaterThan(0);
  });

  it('penalises each switch in an alternating run', () => {
    // day, night, day - two switches.
    const shifts = [
      on('2026-03-02', 't-day'),
      on('2026-03-03', 't-night'),
      on('2026-03-04', 't-day'),
    ];
    expect(scorePatternContinuity(shifts, ctx)).toHaveLength(2);
  });

  it('scores three nights better than an alternating three', () => {
    const steady = [
      on('2026-03-02', 't-night'),
      on('2026-03-03', 't-night'),
      on('2026-03-04', 't-night'),
    ];
    const chaotic = [
      on('2026-03-02', 't-night'),
      on('2026-03-03', 't-day'),
      on('2026-03-04', 't-night'),
    ];

    const total = (list) => list.reduce((sum, p) => sum + p.penalty, 0);
    expect(total(scorePatternContinuity(steady, ctx))).toBeLessThan(
      total(scorePatternContinuity(chaotic, ctx)),
    );
  });

  it('does not penalise a switch either side of a day off', () => {
    const shifts = [on('2026-03-02', 't-day'), on('2026-03-04', 't-night')];
    expect(scorePatternContinuity(shifts, ctx)).toEqual([]);
  });

  it('keeps workers separate', () => {
    const shifts = [
      on('2026-03-02', 't-day', 'a'),
      { ...on('2026-03-03', 't-night', 'b'), membershipId: 'w2' },
    ];
    expect(scorePatternContinuity(shifts, ctx)).toEqual([]);
  });

  it('ignores assignments whose template is unknown', () => {
    const shifts = [on('2026-03-02', 't-day'), on('2026-03-03', 't-missing')];
    expect(scorePatternContinuity(shifts, ctx)).toEqual([]);
  });
});
