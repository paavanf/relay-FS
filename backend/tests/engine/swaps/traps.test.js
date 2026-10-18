// traps.test.js
// The two ways checking a chain edge by edge goes wrong - the reason
// validateCycle checks every cycle whole.
//
//   invalid alone, valid in the cycle   A cannot take B's Tuesday morning
//     while A still works Monday night (minimum rest). But A's offered shift
//     IS that Monday night: in the cycle it is given away, and the conflict
//     goes with it. An edge-by-edge check wrongly throws this chain out.
//
//   valid alone, invalid in the cycle   every hand-over passes the
//     pre-filter, but once A's incoming Saturday sits beside the five days A
//     already works that week, A has six in a row. Trusting the edges
//     wrongly lets it through.

import { describe, it, expect } from 'vitest';
import { availability } from '../helpers/build.js';
import { shift, offer, world, search, peopleIn } from './helpers/world.js';

describe('the trap cases', () => {
  it('finds a chain whose first hand-over is only legal because of what the giver gives away', () => {
    const assignments = [
      shift('a-mon-night', 'A', 't-night', '2026-03-02'),
      shift('b-tue-day', 'B', 't-day', '2026-03-03'),
      shift('c-wed-eve', 'C', 't-eve', '2026-03-04'),
    ];
    const offers = [offer('oA', 'A', 'a-mon-night'), offer('oB', 'B', 'b-tue-day'), offer('oC', 'C', 'c-wed-eve')];
    // No shortcuts: B never works Mondays, A never works Wednesdays, so no direct swap exists.
    const ctx = world({
      people: ['A', 'B', 'C'],
      availability: [
        availability({ membershipId: 'B', dayOfWeek: 1 }),
        availability({ membershipId: 'A', dayOfWeek: 3 }),
      ],
    });

    const result = search({ request: offers[0], offers, assignments, ctx });

    expect(result.direct).toEqual([]);
    expect(result.chains.map(peopleIn)).toEqual([['A', 'B', 'C']]);
    expect(result.chains[0].legs).toEqual([
      { offerId: 'oB', assignmentId: 'b-tue-day', from: 'B', to: 'A' },
      { offerId: 'oC', assignmentId: 'c-wed-eve', from: 'C', to: 'B' },
      { offerId: 'oA', assignmentId: 'a-mon-night', from: 'A', to: 'C' },
    ]);
  });

  it('refuses a swap whose hand-overs each look fine but together give someone six days in a row', () => {
    const fiveDays = ['02', '03', '04', '05', '06'].map((d) => shift(`a-${d}`, 'A', 't-day', `2026-03-${d}`));
    const assignments = [
      ...fiveDays,
      shift('a-sun-15', 'A', 't-day', '2026-03-15'), // what A offers: a Sunday the next week
      shift('b-sat-07', 'B', 't-day', '2026-03-07'), // what B offers: the Saturday after A's five days
    ];
    const offers = [offer('oA', 'A', 'a-sun-15'), offer('oB', 'B', 'b-sat-07')];
    const ctx = world({ people: ['A', 'B'], rules: { maxConsecutiveDays: 5 } });

    const result = search({ request: offers[0], offers, assignments, ctx });

    expect(result.stats.candidateEdges).toBe(2); // both hand-overs pass the pre-filter
    expect(result.direct).toEqual([]);
    expect(result.chains).toEqual([]);
    expect(result.noMatchReasons.summary).toBe('1 offer checked: 1 would give you too many days in a row.');
  });
});
