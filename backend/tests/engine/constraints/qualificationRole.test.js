// qualificationRole.test.js
// An assignment that records its role (slotQualificationId) must go to
// someone holding exactly that qualification - holding another one the
// shift happens to need is not enough. An assignment without a role is a
// legacy record, and keeps the older any-of rule (qualificationMatch.test.js).

import { describe, it, expect } from 'vitest';
import { checkQualificationMatch } from '../../../src/engine/constraints/hard/qualificationMatch.js';
import { evaluate, applyCycle } from '../../../src/engine/index.js';
import { context, localShift, worker, coverage, codesOf } from '../helpers/build.js';

// Monday 2 March 2026: the day shift needs a charge nurse and a registered nurse.
const MONDAY = '2026-03-02';
const dayShift = (id, membershipId, slotQualificationId, date = MONDAY) => ({
  ...localShift({ id, membershipId, shiftTemplateId: 't-day', date, start: '07:00', end: '15:00' }),
  slotQualificationId,
});
const ward = (workers) =>
  context({ workers, coverage: [coverage('t-day', 1, [{ qualificationId: 'CN', count: 1 }, { qualificationId: 'RN', count: 1 }])] });

describe('assignments that record their role', () => {
  it('pass when the assignee holds exactly that role', () => {
    expect(checkQualificationMatch([dayShift('a', 'cn', 'CN')], ward([worker('cn', ['RN', 'CN'])]))).toEqual([]);
  });

  it("refuse someone who holds another of the shift's qualifications but not the role", () => {
    const violations = checkQualificationMatch([dayShift('a', 'rn', 'CN')], ward([worker('rn', ['RN'])]));

    expect(codesOf(violations)).toEqual(['QUALIFICATION_MISMATCH']);
    expect(violations[0].message).toBe('Not qualified for this role on the shift.');
    expect(violations[0].details).toMatchObject({ requiredOneOf: ['CN'], role: 'CN' });
  });

  it('are checked even where no coverage rule exists, since the role is on the assignment itself', () => {
    const noRules = context({ workers: [worker('rn', ['RN'])] });
    expect(codesOf(checkQualificationMatch([dayShift('a', 'rn', 'CN')], noRules))).toEqual(['QUALIFICATION_MISMATCH']);
  });
});

describe('legacy assignments with no role', () => {
  it('keep the old rule: any one of the qualifications the shift calls for will do', () => {
    expect(checkQualificationMatch([dayShift('a', 'rn', undefined)], ward([worker('rn', ['RN'])]))).toEqual([]);
  });

  it('still refuse someone holding none of them, with the old message', () => {
    const violations = checkQualificationMatch([dayShift('a', 'hca', undefined)], ward([worker('hca', ['HCA'])]));
    expect(violations[0].message).toBe('Not qualified for this shift.');
  });
});

describe('a swap keeps the role with the shift', () => {
  it('so a receiver without the role is refused by the same engine check - no separate swap rule', () => {
    const assignments = [dayShift('cn-day', 'cn', 'CN'), dayShift('rn-day', 'rn', 'RN', '2026-03-03')];
    const offers = [{ id: 'o-cn', membershipId: 'cn', assignmentId: 'cn-day' }, { id: 'o-rn', membershipId: 'rn', assignmentId: 'rn-day' }];
    const after = applyCycle(assignments, offers);
    const ctx = ward([worker('cn', ['RN', 'CN']), worker('rn', ['RN'])]);

    expect(after.find((a) => a.id === 'cn-day')).toMatchObject({ membershipId: 'rn', slotQualificationId: 'CN' });
    expect(codesOf(evaluate(after, ctx, { skipSoft: true }).hardViolations)).toEqual(['QUALIFICATION_MISMATCH']);
  });
});
