// explainUnfilled.test.js
// The sentence a manager reads under an unfilled shift has to read as
// English for any count: "1 is unavailable", but "3 are unavailable".

import { describe, it, expect } from 'vitest';
import { describeUnfilled } from '../../../src/engine/scheduling/explainUnfilled.js';

const slot = {
  slotId: 'slot-1',
  date: '2026-10-28',
  shiftTemplateId: 'night',
  qualificationId: 'hca',
  shiftName: 'Night',
  qualificationName: 'Healthcare Assistant',
};

const reasonFor = (qualifiedCount, blockedBy) => describeUnfilled({ slot, qualifiedCount, blockedBy }).reason;

describe('the reason under an unfilled shift', () => {
  it('reads as a whole sentence, the most common blocker first', () => {
    expect(reasonFor(5, { MIN_REST: 1, DECLARED_UNAVAILABLE: 4 })).toBe(
      'Wednesday 28 October, Night: needs a Healthcare Assistant. 5 hold this qualification - 4 are unavailable, 1 would breach minimum rest.',
    );
  });

  it('says "is" for one person and "are" for several', () => {
    expect(reasonFor(1, { DECLARED_UNAVAILABLE: 1 })).toContain('1 holds this qualification - 1 is unavailable.');
    expect(reasonFor(3, { DECLARED_UNAVAILABLE: 3 })).toContain('3 are unavailable.');
    expect(reasonFor(2, { QUALIFICATION_MISMATCH: 1 })).toContain('1 is not qualified for this shift.');
    expect(reasonFor(2, { QUALIFICATION_MISMATCH: 2 })).toContain('2 are not qualified for this shift.');
  });

  it('keeps the wording that reads the same for any count', () => {
    expect(reasonFor(4, { MIN_REST: 2, MAX_WEEKLY_HOURS: 2 })).toContain('2 would breach minimum rest, 2 would exceed weekly hours.');
  });
});
