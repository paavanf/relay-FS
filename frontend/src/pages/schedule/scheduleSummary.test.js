// scheduleSummary.test.js
// The Schedule summary says only what is true. Two days, Monday 2 and
// Tuesday 3 March 2026, each needing one registered nurse on the day shift:
// an empty draft, a partly filled roster (by the generator, and by hand), a
// fully covered one - and a roster no coverage rule asks anything of.

import { describe, it, expect } from 'vitest';
import { summariseRoster, unfilledTile } from './scheduleSummary.js';
import { coverageOn, coverageStatus } from './grid/coverage.js';

const MONDAY = '2026-03-02';
const TUESDAY = '2026-03-03';
const RULES = [1, 2].map((dayOfWeek) => ({ shiftTemplateId: 't-day', dayOfWeek, requirements: [{ qualificationId: 'RN', count: 1 }] }));
const templates = [{ id: 't-day', name: 'Day' }];
const qualificationsById = new Map([['RN', { name: 'Registered Nurse' }]]);
const shift = (date, membershipId) => ({ id: `${membershipId}-${date}`, date, membershipId, shiftTemplateId: 't-day', slotQualificationId: 'RN' });
const HOLE = { date: TUESDAY, shiftTemplateId: 't-day', qualificationId: 'RN' };

function summarise({ assignments = [], unfilledSlots = [], coverage = RULES }) {
  const roster = { startDate: MONDAY, endDate: TUESDAY };
  return summariseRoster({ roster, assignments, unfilledSlots, templates, roles: { coverage, qualificationsById, assignments } });
}
const tile = (summary, canGenerate = true) => unfilledTile(summary, { canGenerate });

describe('the Schedule summary', () => {
  it('an empty draft: no shifts yet, and no claim that anything is covered', () => {
    const summary = summarise({});
    expect(summary).toMatchObject({ shifts: 0, ruled: 2, covered: 0, anyShort: true });
    expect(tile(summary)).toEqual({ value: '-', tone: 'neutral', detail: 'No shifts yet. Generate this roster to fill it.' });
    expect(tile(summary, false).detail).toBe('No shifts yet.');
  });

  it('a partly filled roster from the generator: its hole, listed below', () => {
    const summary = summarise({ assignments: [shift(MONDAY, 'asha')], unfilledSlots: [HOLE] });
    expect(summary).toMatchObject({ shifts: 1, ruled: 2, covered: 1, anyShort: true });
    expect(tile(summary)).toEqual({ value: 1, tone: 'danger', detail: 'listed below, with the reason' });
  });

  it('a partly filled roster made by hand: short days, never "every shift is covered"', () => {
    const summary = summarise({ assignments: [shift(MONDAY, 'asha')] });
    expect(tile(summary)).toEqual({ value: '-', tone: 'neutral', detail: 'Some days are short - see the coverage row.' });
  });

  it('a fully covered roster: every shift is covered', () => {
    const summary = summarise({ assignments: [shift(MONDAY, 'asha'), shift(TUESDAY, 'ben')] });
    expect(summary).toMatchObject({ shifts: 2, people: 2, ruled: 2, covered: 2, anyShort: false });
    expect(tile(summary)).toEqual({ value: 0, tone: 'success', detail: 'every shift is covered' });
  });

  it('nothing to cover: no day is called covered, and the tile says why', () => {
    const summary = summarise({ assignments: [shift(MONDAY, 'asha')], coverage: [] });
    expect(summary.days.map((day) => day.status)).toEqual(['none', 'none']);
    expect(summary).toMatchObject({ ruled: 0, covered: 0 });
    expect(tile(summary)).toEqual({ value: '-', tone: 'neutral', detail: 'No coverage rule asks for anyone on these days.' });
    expect(coverageStatus(coverageOn(MONDAY, { coverage: [], templates, qualificationsById, assignments: [] }))).toBe('none');
  });
});
