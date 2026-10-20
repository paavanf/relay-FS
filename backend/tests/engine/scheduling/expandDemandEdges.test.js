// expandDemandEdges.test.js
// Where wall-clock time and real time disagree, and other edges of turning
// coverage into slots: a night across a clock change gets its real length,
// every slot carries the names that explain it and an id of its own, and a
// rule for a missing template or an unreadable range gives nothing.
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
  it('gives a night crossing a clock change its real duration', () => {
    // British clocks go forward at 01:00 on 2026-03-29, so this night is
    // seven real hours, not the nominal eight.
    const [slot] = expandDemand({
      ...base,
      startDate: '2026-03-28',
      endDate: '2026-03-28',
      coverageRequirements: [
        { shiftTemplateId: 't-night', dayOfWeek: 6, requirements: [{ qualificationId: 'RN', count: 1 }] },
      ],
    });

    const hours = DateTime.fromISO(slot.endsAt).diff(DateTime.fromISO(slot.startsAt), 'hours').hours;
    expect(hours).toBe(7);
  });

  it('carries the names needed to explain an unfilled slot', () => {
    const [slot] = expandDemand({
      ...base,
      startDate: '2026-03-02',
      endDate: '2026-03-02',
      coverageRequirements: [
        { shiftTemplateId: 't-day', dayOfWeek: 1, requirements: [{ qualificationId: 'RN', count: 1 }] },
      ],
    });

    expect(slot.shiftName).toBe('Day');
    expect(slot.qualificationName).toBe('Registered Nurse');
    expect(slot.burdenWeight).toBe(DAY.burdenWeight);
  });

  it('gives every slot a distinct id', () => {
    const slots = expandDemand({
      ...base,
      startDate: '2026-03-02',
      endDate: '2026-03-08',
      coverageRequirements: everyDay('t-day', [{ qualificationId: 'RN', count: 3 }]),
    });

    expect(new Set(slots.map((s) => s.slotId)).size).toBe(slots.length);
  });

  it('ignores a rule pointing at a template that no longer exists', () => {
    const slots = expandDemand({
      ...base,
      startDate: '2026-03-02',
      endDate: '2026-03-02',
      coverageRequirements: [
        { shiftTemplateId: 't-gone', dayOfWeek: 1, requirements: [{ qualificationId: 'RN', count: 1 }] },
      ],
    });

    expect(slots).toEqual([]);
  });

  it('returns nothing for an unparseable range', () => {
    expect(
      expandDemand({ ...base, startDate: 'soon', endDate: 'later', coverageRequirements: [] }),
    ).toEqual([]);
  });
});
