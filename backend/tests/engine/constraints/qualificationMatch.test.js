// qualificationMatch.test.js
// A worker must hold at least one of the qualifications the slot calls for.
// Whether the counts are met is a question about the roster as a whole, and
// deliberately not this constraint's job.

import { describe, it, expect } from 'vitest';
import { checkQualificationMatch } from '../../../src/engine/constraints/hard/qualificationMatch.js';
import { context, localShift, worker, coverage, codesOf } from '../helpers/build.js';

// 2026-03-02 is a Monday, dayOfWeek 1.
const MONDAY = '2026-03-02';
const MONDAY_DOW = 1;

const shift = localShift({ id: 'a', shiftTemplateId: 't-night', date: MONDAY, start: '09:00', end: '17:00' });

function ctxWith({ qualificationIds = [], requirements = [{ qualificationId: 'RN', count: 2 }] }) {
  return context({
    workers: [worker('w1', qualificationIds)],
    coverage: [coverage('t-night', MONDAY_DOW, requirements)],
  });
}

describe('checkQualificationMatch', () => {
  it('finds nothing in an empty set', () => {
    expect(checkQualificationMatch([], ctxWith({}))).toEqual([]);
  });

  it('passes when there is no coverage data at all', () => {
    const ctx = context({ workers: [worker('w1', [])] });
    expect(checkQualificationMatch([shift], ctx)).toEqual([]);
  });

  it('passes when the rule asks for nothing', () => {
    expect(checkQualificationMatch([shift], ctxWith({ requirements: [] }))).toEqual([]);
  });

  it('passes a qualified worker', () => {
    expect(checkQualificationMatch([shift], ctxWith({ qualificationIds: ['RN'] }))).toEqual([]);
  });

  it('flags an unqualified worker', () => {
    const violations = checkQualificationMatch([shift], ctxWith({ qualificationIds: ['CLEANER'] }));
    expect(codesOf(violations)).toEqual(['QUALIFICATION_MISMATCH']);
    expect(violations[0].details.requiredOneOf).toEqual(['RN']);
  });

  it('accepts holding any one of several required qualifications', () => {
    // Monday night needs 2 RNs and 1 CN. A CN belongs on that shift even
    // though they are not an RN.
    const ctx = ctxWith({
      qualificationIds: ['CN'],
      requirements: [
        { qualificationId: 'RN', count: 2 },
        { qualificationId: 'CN', count: 1 },
      ],
    });
    expect(checkQualificationMatch([shift], ctx)).toEqual([]);
  });

  it('only applies the rule to the matching weekday', () => {
    // The rule covers Monday; this shift is on the Tuesday.
    const tuesday = localShift({
      id: 'b',
      shiftTemplateId: 't-night',
      date: '2026-03-03',
      start: '09:00',
      end: '17:00',
    });
    expect(checkQualificationMatch([tuesday], ctxWith({ qualificationIds: [] }))).toEqual([]);
  });

  it('only applies the rule to the matching shift template', () => {
    const otherTemplate = { ...shift, id: 'c', shiftTemplateId: 't-day' };
    expect(checkQualificationMatch([otherTemplate], ctxWith({ qualificationIds: [] }))).toEqual([]);
  });

  it('treats an unknown worker as holding nothing', () => {
    // We cannot show they are qualified, so the safe answer is that they are
    // not - better a false rejection than an unqualified person on a ward.
    const ctx = context({
      workers: [],
      coverage: [coverage('t-night', MONDAY_DOW, [{ qualificationId: 'RN', count: 1 }])],
    });
    expect(codesOf(checkQualificationMatch([shift], ctx))).toEqual(['QUALIFICATION_MISMATCH']);
  });

  it('uses the local weekday of a night shift to find the rule', () => {
    // Starts 23:00 Monday local. The rule that applies is Monday's.
    const lateMonday = localShift({
      id: 'n',
      shiftTemplateId: 't-night',
      date: MONDAY,
      start: '23:00',
      end: '07:00',
    });
    expect(codesOf(checkQualificationMatch([lateMonday], ctxWith({ qualificationIds: [] })))).toEqual(
      ['QUALIFICATION_MISMATCH'],
    );
  });
});
