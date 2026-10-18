// explainNoMatch.test.js
// "No options" must come with reasons a worker can act on, counted right.

import { describe, it, expect } from 'vitest';
import { availability, coverage } from '../helpers/build.js';
import { shift, offer, world, search } from './helpers/world.js';

describe('explaining why there are no options', () => {
  it('counts each other offer once, under the first thing that rules it out', () => {
    // R holds RN only. Day shifts on the 10th and 11th (Tue, Wed) need a
    // charge nurse; R works a night into the morning of the 13th; and R
    // never works Saturdays.
    const assignments = [
      shift('r-offer', 'R', 't-day', '2026-03-02'),
      shift('r-night', 'R', 't-night', '2026-03-12'),
      shift('cn-1', 'X1', 't-day', '2026-03-10'),
      shift('cn-2', 'X2', 't-day', '2026-03-11'),
      shift('rest', 'X3', 't-day', '2026-03-13'),
      shift('sat', 'X4', 't-day', '2026-03-14'),
    ];
    const offers = [
      offer('oR', 'R', 'r-offer'),
      offer('o1', 'X1', 'cn-1'),
      offer('o2', 'X2', 'cn-2'),
      offer('o3', 'X3', 'rest'),
      offer('o4', 'X4', 'sat'),
    ];
    const ctx = world({
      people: [{ id: 'R', qualificationIds: ['RN'] }, ...['X1', 'X2', 'X3', 'X4'].map((id) => ({ id, qualificationIds: ['RN', 'CN'] }))],
      coverage: [2, 3].map((dayOfWeek) => coverage('t-day', dayOfWeek, [{ qualificationId: 'CN', count: 1 }])),
      availability: [availability({ membershipId: 'R', dayOfWeek: 6 })],
    });

    const { noMatchReasons } = search({ request: offers[0], offers, assignments, ctx });

    expect(noMatchReasons.offersChecked).toBe(4);
    expect(noMatchReasons.reasons).toEqual([
      { side: 'you', code: 'QUALIFICATION_MISMATCH', count: 2 },
      { side: 'you', code: 'DECLARED_UNAVAILABLE', count: 1 },
      { side: 'you', code: 'MIN_REST', count: 1 },
    ]);
    expect(noMatchReasons.summary).toBe(
      "4 offers checked: 2 need a qualification you don't hold, 1 is on a day you marked unavailable, 1 would break minimum rest.",
    );
  });

  it('says when it is the other person who cannot take your shift', () => {
    const assignments = [shift('r-offer', 'R', 't-day', '2026-03-03'), shift('y-offer', 'Y', 't-day', '2026-03-04')];
    const offers = [offer('oR', 'R', 'r-offer'), offer('oY', 'Y', 'y-offer')];
    const ctx = world({ people: ['R', 'Y'], availability: [availability({ membershipId: 'Y', dayOfWeek: 2 })] });

    const { noMatchReasons } = search({ request: offers[0], offers, assignments, ctx });

    expect(noMatchReasons.reasons).toEqual([{ side: 'them', code: 'DECLARED_UNAVAILABLE', count: 1 }]);
    expect(noMatchReasons.summary).toBe('1 offer checked: 1 is from someone unavailable when your shift is.');
  });

  it('explains an organisation where nobody else has offered anything', () => {
    const assignments = [shift('r-offer', 'R', 't-day', '2026-03-03')];
    const offers = [offer('oR', 'R', 'r-offer')];
    const { direct, chains, noMatchReasons } = search({ request: offers[0], offers, assignments, ctx: world({ people: ['R'] }) });

    expect([direct, chains]).toEqual([[], []]);
    expect(noMatchReasons).toEqual({
      offersChecked: 0,
      reasons: [],
      summary: 'Nobody else has offered a shift yet, so there is nothing to swap with.',
    });
  });
});
