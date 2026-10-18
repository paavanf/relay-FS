// search.test.js
// How the search behaves: one rotation per chain, the length cap, the
// requester in every result, nobody twice, and bounds that stop it.

import { describe, it, expect } from 'vitest';
import { availability } from '../helpers/build.js';
import { fakeClock } from '../scheduling/helpers/build.js';
import { canonicalKey } from '../../../src/engine/index.js';
import { shift, offer, world, search, peopleIn } from './helpers/world.js';

// A ring of four: each person can take only the next person's shift, so the
// one way to resolve anything is the whole loop A->B->C->D->A.
function ringOfFour() {
  const days = { A: '2026-03-02', B: '2026-03-03', C: '2026-03-04', D: '2026-03-05' };
  const assignments = Object.entries(days).map(([who, date]) => shift(`s-${who}`, who, 't-day', date));
  const offers = Object.keys(days).map((who) => offer(`o${who}`, who, `s-${who}`));
  const off = (who, dows) => dows.map((dayOfWeek) => availability({ membershipId: who, dayOfWeek }));
  const ctx = world({
    people: ['A', 'B', 'C', 'D'],
    availability: [...off('A', [3, 4]), ...off('B', [1, 4]), ...off('C', [1, 2]), ...off('D', [2, 3])],
  });
  return { assignments, offers, ctx };
}

// Six people, each offering a day the others are free to take: every pairing works.
function everyoneSwaps(count = 6) {
  const people = Array.from({ length: count }, (_, i) => `P${i}`);
  const assignments = people.map((who, i) => shift(`s-${who}`, who, 't-day', `2026-03-${String(2 + i * 2).padStart(2, '0')}`));
  const offers = people.map((who) => offer(`o-${who}`, who, `s-${who}`));
  return { assignments, offers, ctx: world({ people }) };
}

describe('the swap search', () => {
  it('treats rotations as one chain, but a reversed chain as a different one', () => {
    const [a, b, c] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(canonicalKey([b, c, a])).toBe(canonicalKey([a, b, c]));
    expect(canonicalKey([c, a, b])).toBe(canonicalKey([a, b, c]));
    expect(canonicalKey([a, c, b])).not.toBe(canonicalKey([a, b, c]));
  });

  it('returns no two rotations of the same chain', () => {
    const { assignments, offers, ctx } = everyoneSwaps();
    const result = search({ request: offers[0], offers, assignments, ctx, maxLength: 4, topN: 1000 });
    const all = [...result.direct, ...result.chains];
    const keys = all.map((chain) => canonicalKey(chain.offerIds.map((id) => ({ id }))));

    expect(result.chains.length).toBeGreaterThan(10); // plenty of chains, so a duplicate would have had room to appear
    expect(new Set(keys).size).toBe(all.length);
  });

  it('respects the length cap', () => {
    const { assignments, offers, ctx } = ringOfFour();
    expect(search({ request: offers[0], offers, assignments, ctx, maxLength: 3 }).chains).toEqual([]);

    const result = search({ request: offers[0], offers, assignments, ctx, maxLength: 4 });
    expect(result.chains.map(peopleIn)).toEqual([['A', 'B', 'C', 'D']]);
  });

  it('always puts the requester in the chain, starting from them', () => {
    const { assignments, offers, ctx } = ringOfFour();
    const result = search({ request: offers[2], offers, assignments, ctx });
    expect(result.chains.map(peopleIn)).toEqual([['C', 'D', 'A', 'B']]);
  });

  it('never puts anyone in a chain twice, even someone offering two shifts', () => {
    const { assignments, offers, ctx } = everyoneSwaps(4);
    const second = shift('s-P1-b', 'P1', 't-day', '2026-03-20');
    const more = [...offers, offer('o-P1-b', 'P1', 's-P1-b')];
    const result = search({ request: more[0], offers: more, assignments: [...assignments, second], ctx, topN: 1000 });

    for (const chain of [...result.direct, ...result.chains]) {
      const givers = chain.legs.map((leg) => leg.from);
      expect(new Set(givers).size).toBe(givers.length);
      expect(new Set(chain.offerIds).size).toBe(chain.offerIds.length);
    }
  });

  it('stops at the time budget and says it was cut short', () => {
    const { assignments, offers, ctx } = everyoneSwaps(10);
    const result = search({ request: offers[0], offers, assignments, ctx, now: fakeClock(1000), limits: { budgetMs: 1 } });
    expect(result.stats.truncated).toBe(true);
    expect(result.stats.cyclesChecked).toBeLessThan(5);
  });

  it('stops at the node cap too', () => {
    const { assignments, offers, ctx } = everyoneSwaps(10);
    const result = search({ request: offers[0], offers, assignments, ctx, limits: { maxNodes: 20 } });
    expect(result.stats.truncated).toBe(true);
    expect(result.direct.length).toBeGreaterThan(0); // shortest first: the direct swaps were already found
  });
});
