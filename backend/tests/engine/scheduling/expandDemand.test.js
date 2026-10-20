// expandDemand.test.js
// Turning coverage rules into slots: nothing without rules, one slot per
// person needed on each matching day, a rule with several qualifications as
// separate slots, the right weekday, and a night that ends the next day.
//
// Coverage rules in, concrete slots out.

import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { expandDemand } from '../../../src/engine/scheduling/expandDemand.js';
import { DAY, NIGHT, QUALIFICATIONS, everyDay, TZ } from './helpers/build.js';

const base = {
  shiftTemplates: [DAY, NIGHT],
  qualifications: QUALIFICATIONS,
  timezone: TZ,
};

describe('expandDemand', () => {
  it('produces nothing without coverage rules', () => {
    expect(
      expandDemand({ ...base, startDate: '2026-03-02', endDate: '2026-03-08', coverageRequirements: [] }),
    ).toEqual([]);
  });

  it('produces one slot per person needed, per matching day', () => {
    // A week, one rule per day, two people needed: 14 slots.
    const slots = expandDemand({
      ...base,
      startDate: '2026-03-02',
      endDate: '2026-03-08',
      coverageRequirements: everyDay('t-day', [{ qualificationId: 'RN', count: 2 }]),
    });

    expect(slots).toHaveLength(14);
    expect(new Set(slots.map((s) => s.date)).size).toBe(7);
  });

  it('splits a multi-qualification rule into separate slots', () => {
    const slots = expandDemand({
      ...base,
      startDate: '2026-03-02',
      endDate: '2026-03-02',
      coverageRequirements: [
        {
          shiftTemplateId: 't-day',
          dayOfWeek: 1,
          requirements: [
            { qualificationId: 'RN', count: 2 },
            { qualificationId: 'CN', count: 1 },
          ],
        },
      ],
    });

    expect(slots).toHaveLength(3);
    expect(slots.filter((s) => s.qualificationId === 'RN')).toHaveLength(2);
    expect(slots.filter((s) => s.qualificationId === 'CN')).toHaveLength(1);
  });

  it('only matches the rule for that weekday', () => {
    // 2026-03-02 is a Monday (dayOfWeek 1).
    const slots = expandDemand({
      ...base,
      startDate: '2026-03-02',
      endDate: '2026-03-08',
      coverageRequirements: [
        { shiftTemplateId: 't-day', dayOfWeek: 0, requirements: [{ qualificationId: 'RN', count: 1 }] },
      ],
    });

    expect(slots).toHaveLength(1);
    expect(slots[0].date).toBe('2026-03-08'); // the Sunday
  });

  it('ends a night shift on the following day', () => {
    const [slot] = expandDemand({
      ...base,
      startDate: '2026-03-02',
      endDate: '2026-03-02',
      coverageRequirements: [
        { shiftTemplateId: 't-night', dayOfWeek: 1, requirements: [{ qualificationId: 'RN', count: 1 }] },
      ],
    });

    // 23:00 to 07:00 is eight hours, and the slot still belongs to the day it
    // started on.
    const hours = DateTime.fromISO(slot.endsAt).diff(DateTime.fromISO(slot.startsAt), 'hours').hours;
    expect(hours).toBe(8);
    expect(slot.date).toBe('2026-03-02');
  });
});
