// roles.test.js
// The roles on a shift and the coverage row, counted role by role.
//
// Monday 2 March: the day shift needs 1 charge nurse (CN) and 2 registered
// nurses (RN). For the role choices, one RN place is filled, and one person
// with no role recorded (a legacy record) is on the shift too; the coverage
// tests set out their own day.

import { describe, it, expect } from 'vitest';
import { roleChoices, defaultRole } from './roles.js';
import { coverageOn, describeCoverage } from './grid/coverage.js';

const MONDAY = '2026-03-02';
const coverage = [{ shiftTemplateId: 't-day', dayOfWeek: 1, requirements: [{ qualificationId: 'CN', count: 1 }, { qualificationId: 'RN', count: 2 }] }];
const qualificationsById = new Map([['CN', { name: 'Charge Nurse' }], ['RN', { name: 'Registered Nurse' }]]);
const assignments = [
  { id: 'a1', date: MONDAY, shiftTemplateId: 't-day', slotQualificationId: 'RN' },
  { id: 'a2', date: MONDAY, shiftTemplateId: 't-day', slotQualificationId: null },
];
const choicesFor = (member, ignoreId) => roleChoices({ coverage, qualificationsById, assignments, shiftTemplateId: 't-day', date: MONDAY, member, ignoreId });

describe('roles on a shift', () => {
  it("lists the shift's roles with how many places are open, and which the person holds", () => {
    expect(choicesFor({ qualificationIds: ['RN'] })).toEqual([
      { qualificationId: 'CN', name: 'Charge Nurse', required: 1, filled: 0, open: 1, held: false },
      { qualificationId: 'RN', name: 'Registered Nurse', required: 2, filled: 1, open: 1, held: true },
    ]);
  });

  it('does not count the assignment being edited against itself', () => {
    expect(choicesFor({ qualificationIds: ['RN'] }, 'a1')[1]).toMatchObject({ filled: 0, open: 2 });
  });

  it('has no roles on a day without a coverage rule', () => {
    expect(roleChoices({ coverage, qualificationsById, assignments, shiftTemplateId: 't-day', date: '2026-03-03', member: {} })).toEqual([]);
  });
});

describe('the role chosen automatically', () => {
  it("is someone's only role on the shift", () => {
    expect(defaultRole(choicesFor({ qualificationIds: ['RN'] }))).toBe('RN');
  });

  it('is their only role with a place still open', () => {
    const full = [{ qualificationId: 'CN', held: true, open: 0 }, { qualificationId: 'RN', held: true, open: 1 }];
    expect(defaultRole(full)).toBe('RN');
  });

  it('is left to the manager when two of their roles are open, or none of the roles is theirs', () => {
    expect(defaultRole(choicesFor({ qualificationIds: ['RN', 'CN'] }))).toBeNull();
    expect(defaultRole(choicesFor({ qualificationIds: ['HCA'] }))).toBeNull();
  });
});

describe('coverage, role by role', () => {
  const templates = [{ _id: 't-day', name: 'Day' }];
  const onDayShift = (id, slotQualificationId) => ({ id, date: MONDAY, shiftTemplateId: 't-day', slotQualificationId });

  // Two registered nurses and no charge nurse: the count is close, the shift is not covered.
  const day = coverageOn(MONDAY, { coverage, templates, qualificationsById, assignments: [onDayShift('a1', 'RN'), onDayShift('a3', 'RN')] });

  it('counts every place the rules ask for, and every shift on the day', () => {
    expect(day).toMatchObject({ filled: 2, required: 3, unrecorded: 0 });
  });

  it('names the roles that are short, so "2/3" can say who is missing', () => {
    expect(day.short).toEqual([{ shift: 'Day', role: 'Charge Nurse', missing: 1 }]);
    expect(describeCoverage(day)).toBe('2 of 3 places filled. Missing: 1 Charge Nurse on Day.');
  });

  it('counts a day with shifts saved before roles by headcount, and says so', () => {
    const legacy = coverageOn(MONDAY, { coverage, templates, qualificationsById, assignments: [onDayShift('a1', 'RN'), onDayShift('a2', null), onDayShift('a4', null)] });
    expect(legacy).toMatchObject({ filled: 3, required: 3, short: [], unrecorded: 2 });
    expect(describeCoverage(legacy)).toBe('3 of 3 places filled. 2 shifts were saved before Relay recorded roles, so this day is counted by headcount only.');
  });
});
