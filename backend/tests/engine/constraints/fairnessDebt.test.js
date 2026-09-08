// fairnessDebt.test.js
// A stub with a real interface. The point of these tests is that the seam
// behaves predictably now, so Milestone 6 only has to supply the numbers.

import { describe, it, expect } from 'vitest';
import { scoreFairnessDebt } from '../../../src/engine/constraints/soft/fairnessDebt.js';
import { context, localShift, template, codesOf } from '../helpers/build.js';

const templates = [template('t-day', 'day', 1), template('t-night', 'night', 1.5)];

function ctxWith(fairnessDebt) {
  return context({ shiftTemplates: templates, fairnessDebt });
}

const nightShift = localShift({
  id: 'a',
  shiftTemplateId: 't-night',
  date: '2026-03-02',
  start: '23:00',
  end: '07:00',
});

describe('scoreFairnessDebt', () => {
  it('scores nothing when no ledger has been supplied', () => {
    expect(scoreFairnessDebt([nightShift], context({ shiftTemplates: templates }))).toEqual([]);
  });

  it('scores nothing on an empty set', () => {
    expect(scoreFairnessDebt([], ctxWith({ w1: 5 }))).toEqual([]);
  });

  it('scores nothing for a worker who is not in debt', () => {
    expect(scoreFairnessDebt([nightShift], ctxWith({ w1: 0 }))).toEqual([]);
  });

  it('scores nothing for a worker owed burden rather than carrying it', () => {
    expect(scoreFairnessDebt([nightShift], ctxWith({ w1: -3 }))).toEqual([]);
  });

  it('penalises adding burden to someone already over', () => {
    const penalties = scoreFairnessDebt([nightShift], ctxWith({ w1: 4 }));
    expect(codesOf(penalties)).toEqual(['FAIRNESS_DEBT']);
    expect(penalties[0].penalty).toBe(6); // debt 4 x burdenWeight 1.5
  });

  it('scales the penalty with the shift burden', () => {
    const dayShift = { ...nightShift, id: 'b', shiftTemplateId: 't-day' };

    const night = scoreFairnessDebt([nightShift], ctxWith({ w1: 4 }))[0].penalty;
    const day = scoreFairnessDebt([dayShift], ctxWith({ w1: 4 }))[0].penalty;
    expect(night).toBeGreaterThan(day);
  });

  it('scales the penalty with the size of the debt', () => {
    const small = scoreFairnessDebt([nightShift], ctxWith({ w1: 1 }))[0].penalty;
    const large = scoreFairnessDebt([nightShift], ctxWith({ w1: 10 }))[0].penalty;
    expect(large).toBeGreaterThan(small);
  });

  it('assumes a neutral burden when the template is unknown', () => {
    const unknown = { ...nightShift, shiftTemplateId: 't-gone' };
    expect(scoreFairnessDebt([unknown], ctxWith({ w1: 3 }))[0].penalty).toBe(3);
  });

  it('ignores a debt entry that is not a number', () => {
    expect(scoreFairnessDebt([nightShift], ctxWith({ w1: 'lots' }))).toEqual([]);
  });
});
