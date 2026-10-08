// memberChanges.test.js
// The edit-member form's PATCH body: only what changed, and never a role from
// someone who may not change roles.

import { describe, it, expect } from 'vitest';
import { formValuesOf, hoursProblem, changedFields, mayDeactivate } from './memberChanges.js';

const member = {
  id: 'm1',
  userId: 'u1',
  role: 'member',
  qualificationIds: ['rn', 'cn'],
  employmentType: 'full-time',
  contractedHoursPerWeek: 37.5,
};

describe('changedFields', () => {
  it('sends nothing for an untouched form', () => {
    expect(changedFields(member, formValuesOf(member), { canChangeRole: true })).toEqual({});
  });

  it('sends only the fields that changed, ignoring qualification order', () => {
    const values = { ...formValuesOf(member), qualificationIds: ['cn', 'rn'], hours: '22.5', employmentType: 'part-time' };
    expect(changedFields(member, values, { canChangeRole: true })).toEqual({
      employmentType: 'part-time',
      contractedHoursPerWeek: 22.5,
    });
  });

  it('never sends a role for someone who may not change roles', () => {
    const values = { ...formValuesOf(member), role: 'owner' };
    expect(changedFields(member, values, { canChangeRole: false })).toEqual({});
    expect(changedFields(member, values, { canChangeRole: true })).toEqual({ role: 'owner' });
  });
});

describe('hoursProblem', () => {
  it('accepts 0 to 80, including halves', () => {
    for (const text of ['0', '22.5', '80']) expect(hoursProblem(text)).toBeNull();
  });

  it('refuses blanks, words and anything out of range', () => {
    for (const text of ['', ' ', 'forty', '-1', '80.5']) expect(hoursProblem(text)).not.toBeNull();
  });
});

describe('mayDeactivate', () => {
  it('lets an owner deactivate anyone but themselves', () => {
    expect(mayDeactivate({ member: { ...member, role: 'manager' }, viewerUserId: 'u9', viewerIsOwner: true })).toBe(true);
    expect(mayDeactivate({ member, viewerUserId: 'u1', viewerIsOwner: true })).toBe(false);
  });

  it('lets a manager deactivate members only', () => {
    expect(mayDeactivate({ member, viewerUserId: 'u9', viewerIsOwner: false })).toBe(true);
    expect(mayDeactivate({ member: { ...member, role: 'manager' }, viewerUserId: 'u9', viewerIsOwner: false })).toBe(false);
  });
});
