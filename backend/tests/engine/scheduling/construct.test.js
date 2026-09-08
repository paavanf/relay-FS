// construct.test.js
// The greedy pass. Its one inviolable promise: it would rather leave a shift
// empty than break a rule to fill it.

import { describe, it, expect } from 'vitest';
import { construct } from '../../../src/engine/scheduling/construct.js';
import { expandDemand } from '../../../src/engine/scheduling/expandDemand.js';
import { resolveWeights } from '../../../src/engine/scheduling/weights.js';
import { evaluate } from '../../../src/engine/constraints/evaluate.js';
import { scenario, contextOf, workers, everyDay } from './helpers/build.js';

const weights = resolveWeights();

function build(input) {
  const context = contextOf(input);
  const slots = expandDemand(input);
  return { ...construct({ slots, context, weights }), slots, context };
}

describe('construct', () => {
  it('handles having nothing to do', () => {
    const input = scenario({ coverageRequirements: [] });
    const built = build(input);
    expect(built.assignments).toEqual([]);
    expect(built.unfilledSlots).toEqual([]);
  });

  it('fills a comfortably staffed week completely', () => {
    const built = build(scenario({ workers: workers(12) }));
    expect(built.unfilledSlots).toEqual([]);
    expect(built.assignments).toHaveLength(built.slots.length);
  });

  it('never produces a hard violation', () => {
    const built = build(scenario({ workers: workers(12) }));
    expect(evaluate(built.assignments, built.context).isValid).toBe(true);
  });

  it('never produces a hard violation even when badly over-constrained', () => {
    // Three people, three shifts a day, every day - impossible without
    // breaking rest rules. It must leave holes, not break them.
    const input = scenario({
      workers: workers(3),
      coverageRequirements: [
        ...everyDay('t-day', [{ qualificationId: 'RN', count: 2 }]),
        ...everyDay('t-eve', [{ qualificationId: 'RN', count: 2 }]),
        ...everyDay('t-night', [{ qualificationId: 'RN', count: 2 }]),
      ],
    });

    const built = build(input);
    expect(built.unfilledSlots.length).toBeGreaterThan(0);
    expect(evaluate(built.assignments, built.context).isValid).toBe(true);
  });

  it('leaves a slot unfilled when nobody holds the qualification', () => {
    const input = scenario({
      workers: workers(6, ['RN']),
      coverageRequirements: everyDay('t-day', [{ qualificationId: 'CN', count: 1 }]),
    });

    const built = build(input);
    expect(built.assignments).toEqual([]);
    expect(built.unfilledSlots).toHaveLength(7);
  });

  it('explains every unfilled slot in a sentence a manager can act on', () => {
    const input = scenario({
      workers: workers(6, ['RN']),
      coverageRequirements: everyDay('t-day', [{ qualificationId: 'CN', count: 1 }]),
    });

    for (const hole of build(input).unfilledSlots) {
      expect(hole.reason).toContain('Charge Nurse');
      expect(hole.reason).toContain('Day');
      expect(hole.reason).toMatch(/Nobody in the team holds this qualification/);
      expect(hole.qualifiedCount).toBe(0);
    }
  });

  it('names the constraint that blocked people, not just the count', () => {
    // One person, two shifts a day: the second is blocked by rest, not by a
    // missing qualification.
    const input = scenario({
      endDate: '2026-03-03',
      workers: workers(1),
      coverageRequirements: [
        ...everyDay('t-day', [{ qualificationId: 'RN', count: 1 }]),
        ...everyDay('t-eve', [{ qualificationId: 'RN', count: 1 }]),
      ],
    });

    const built = build(input);
    const blocked = built.unfilledSlots.filter((u) => u.qualifiedCount > 0);

    expect(blocked.length).toBeGreaterThan(0);
    expect(Object.keys(blocked[0].blockedBy).length).toBeGreaterThan(0);
    expect(blocked[0].reason).toMatch(/holds? this qualification/);
  });

  it('is deterministic - the same input builds the same roster', () => {
    const input = scenario({ workers: workers(8) });
    const first = build(input).assignments;
    const second = build(input).assignments;

    expect(first).toEqual(second);
  });

  it('does not depend on the order the workers were listed', () => {
    const input = scenario({ workers: workers(8) });
    const reversed = { ...input, workers: [...input.workers].reverse() };

    // The set of slots filled must match, even if who got what can differ.
    const a = build(input);
    const b = build(reversed);
    expect(a.assignments.length).toBe(b.assignments.length);
    expect(a.unfilledSlots.length).toBe(b.unfilledSlots.length);
  });

  it('respects a declared unavailability rather than filling over it', () => {
    const input = scenario({
      workers: workers(2),
      coverageRequirements: everyDay('t-day', [{ qualificationId: 'RN', count: 2 }]),
      availability: [
        { membershipId: 'w0', type: 'recurring', dayOfWeek: 1, shiftTemplateId: null, status: 'unavailable', date: null },
      ],
    });

    const built = build(input);
    const monday = built.assignments.filter((a) => a.date === '2026-03-02');
    expect(monday.every((a) => a.membershipId !== 'w0')).toBe(true);
    expect(evaluate(built.assignments, built.context).isValid).toBe(true);
  });
});
