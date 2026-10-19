// filters.test.js
// "What would you take in return?" - an offer's filters on kinds of shift and
// weekdays. An edge X -> Y needs Y's shift to match X's own filters; that is
// a pre-filter check, and a no-options answer counts it as its own reason.

import { describe, it, expect } from 'vitest';
import { acceptsShift } from '../../../src/engine/swaps/acceptsShift.js';
import { buildGraph } from '../../../src/engine/swaps/buildGraph.js';
import { shift, offer, world, search } from './helpers/world.js';

const ward = { shiftTemplates: [{ id: 't-day', category: 'day' }, { id: 't-night', category: 'night' }], timezone: 'Asia/Kolkata' };

describe('acceptsShift', () => {
  const day = { shiftTemplateId: 't-day', startsAt: '2026-03-02T01:30:00.000Z' }; // Monday 07:00 in Kolkata

  it('takes anything when nothing was said', () => {
    expect(acceptsShift(undefined, day, ward)).toBe(true);
    expect(acceptsShift({ categories: [], daysOfWeek: [] }, day, ward)).toBe(true);
  });

  it('checks the kind of shift by its template', () => {
    expect(acceptsShift({ categories: ['day'] }, day, ward)).toBe(true);
    expect(acceptsShift({ categories: ['night', 'evening'] }, day, ward)).toBe(false);
  });

  it("reads the weekday in the organisation's timezone, not UTC", () => {
    // 01:00 on Saturday 7 March in Kolkata is still Friday evening in UTC.
    const earlySaturday = { shiftTemplateId: 't-night', startsAt: '2026-03-06T19:30:00.000Z' };
    expect(acceptsShift({ daysOfWeek: [6] }, earlySaturday, ward)).toBe(true);
    expect(acceptsShift({ daysOfWeek: [5] }, earlySaturday, ward)).toBe(false);
  });

  it('needs both lists to agree when both are given', () => {
    expect(acceptsShift({ categories: ['day'], daysOfWeek: [1] }, day, ward)).toBe(true);
    expect(acceptsShift({ categories: ['day'], daysOfWeek: [2] }, day, ward)).toBe(false);
  });
});

// A offers a Monday day shift and will only take nights; B offers a
// Wednesday night and C a Friday day, both happy with anything.
function pool() {
  const assignments = [shift('a', 'A', 't-day', '2026-03-02'), shift('b', 'B', 't-night', '2026-03-04'), shift('c', 'C', 't-day', '2026-03-06')];
  const offers = [{ ...offer('oA', 'A', 'a'), filters: { categories: ['night'] } }, offer('oB', 'B', 'b'), offer('oC', 'C', 'c')];
  return { assignments, offers, ctx: world({ people: ['A', 'B', 'C'] }) };
}

describe('edges and filters', () => {
  it("leaves out an edge to a shift the taker said they would not take, and says why", () => {
    const { assignments, offers, ctx } = pool();
    const graph = buildGraph({ offers, assignmentsById: new Map(assignments.map((a) => [a.id, a])), context: ctx });

    expect(graph.edges.get('oA')).toEqual(['oB']);
    expect(graph.blocked.get('oA|oC')).toEqual(['FILTER_MISMATCH']);
  });

  it("counts filtered-out offers under their own reason when nothing is found", () => {
    const { assignments, offers, ctx } = pool();
    const eveningsOnly = { ...offers[0], filters: { categories: ['evening'] } };
    const { noMatchReasons } = search({ request: eveningsOnly, offers: [eveningsOnly, offers[1], offers[2]], assignments, ctx });

    expect(noMatchReasons.reasons).toEqual([{ side: 'you', code: 'FILTER_MISMATCH', count: 2 }]);
    expect(noMatchReasons.summary).toBe("2 offers checked: 2 didn't match what you said you'd take.");
  });

  it("explains the other side too: their filters can rule out your shift", () => {
    const { assignments, offers, ctx } = pool();
    const fussy = [offers[0], { ...offers[1], filters: { categories: ['evening'] } }];
    const { noMatchReasons } = search({ request: fussy[0], offers: fussy, assignments, ctx });

    expect(noMatchReasons.summary).toBe("1 offer checked: 1 is from someone who said they wouldn't take a shift like yours.");
  });
});
