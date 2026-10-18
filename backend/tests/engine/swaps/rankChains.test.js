// rankChains.test.js
// Best first: fewer people, then nobody stuck with a shift they asked to
// avoid, then burden moving toward whoever carries less.

import { describe, it, expect } from 'vitest';
import { availability } from '../helpers/build.js';
import { shift, offer, world, search, peopleIn } from './helpers/world.js';

// R can swap directly with D, or go round R -> B -> C -> R.
function choices(extraAvailability = []) {
  const assignments = [
    shift('r', 'R', 't-day', '2026-03-02'),
    shift('d', 'D', 't-day', '2026-03-04'),
    shift('b', 'B', 't-day', '2026-03-06'),
    shift('c', 'C', 't-day', '2026-03-08'),
  ];
  const offers = [offer('oR', 'R', 'r'), offer('oD', 'D', 'd'), offer('oB', 'B', 'b'), offer('oC', 'C', 'c')];
  return { assignments, offers, ctx: world({ people: ['R', 'D', 'B', 'C'], availability: extraAvailability }) };
}

describe('ranking swap options', () => {
  it('scores a direct swap ahead of a three-person chain', () => {
    const { assignments, offers, ctx } = choices();
    const { direct, chains } = search({ request: offers[0], offers, assignments, ctx });
    expect(direct[0].score.total).toBeLessThan(chains[0].score.total);
    expect(direct[0].score.people).toBe(2);
  });

  it('puts a swap onto a shift its receiver marked avoid behind one that is not', () => {
    // R would rather not work Wednesdays (D's shift) or Fridays (B's).
    const avoid = [3, 5].map((dayOfWeek) => availability({ membershipId: 'R', dayOfWeek, status: 'avoid' }));
    const { assignments, offers, ctx } = choices(avoid);
    const { direct } = search({ request: offers[0], offers, assignments, ctx, topN: 10 });

    const withD = direct.find((chain) => peopleIn(chain).includes('D'));
    const withC = direct.find((chain) => peopleIn(chain).includes('C'));
    expect(withD.score.avoided).toBe(1);
    expect(withC.score.avoided).toBe(0);
    expect(direct.indexOf(withC)).toBeLessThan(direct.indexOf(withD));
  });

  it('rewards moving burden toward someone carrying less than their share', () => {
    // R, already over their share, offers a night (burden 1.8); the others
    // offer days (1.0). Only D is under their share.
    const { offers, ctx } = choices();
    const assignments = [
      shift('r', 'R', 't-night', '2026-03-02'),
      shift('d', 'D', 't-day', '2026-03-04'),
      shift('b', 'B', 't-day', '2026-03-06'),
      shift('c', 'C', 't-day', '2026-03-08'),
    ];
    const debts = { R: 6, D: -6, B: 6, C: 6 };

    const { direct } = search({ request: offers[0], offers, assignments, ctx, fairnessDebt: debts, topN: 10 });

    // Swapping with D moves 0.8 burden points from R to D: |6| + |-6| = 12
    // becomes 5.2 + 5.2 = 10.4. Swapping with B or C only shifts who is over.
    expect(peopleIn(direct[0])).toEqual(['R', 'D']);
    expect(direct[0].score.fairnessGain).toBe(1.6);
    expect(direct.slice(1).map((chain) => chain.score.fairnessGain)).toEqual([0, 0]);
  });
});
