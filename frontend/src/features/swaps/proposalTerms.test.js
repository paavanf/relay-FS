// proposalTerms.test.js
// The swap rules as sentences, and what proposing an option would mean for
// the person proposing it: what they give, what they take, and when the
// proposal would end.

import { describe, it, expect } from 'vitest';
import { swapRuleSentences, windowWords } from './swapRuleSentences.js';
import { givesAndTakes, proposalDeadline } from './proposalTerms.js';

const NOW = Date.parse('2026-03-10T09:00:00Z');

describe('swap rules as sentences', () => {
  it('reads whole days as days and the rest as hours', () => {
    expect([windowWords(48), windowWords(24), windowWords(36), windowWords(1)]).toEqual(['2 days', '1 day', '36 hours', '1 hour']);
  });

  it('says whether a manager approves, and how long chains can be', () => {
    expect(swapRuleSentences({ acceptanceWindowHours: 48, requireManagerApproval: true, maxChainLength: 4 })).toEqual([
      'Everyone in a proposed swap has 2 days to accept it - less if one of its shifts starts sooner.',
      'A manager approves every swap before it happens.',
      'Chains can be up to 4 people long.',
    ]);
    expect(swapRuleSentences({ acceptanceWindowHours: 12, requireManagerApproval: false, maxChainLength: 2 }).slice(1)).toEqual([
      'A swap happens as soon as everyone in it has accepted.',
      'Only direct swaps between two people are suggested.',
    ]);
  });
});

describe('what a proposal would mean', () => {
  const shift = (id, startsAt) => ({ id, startsAt });
  const option = {
    legs: [
      { from: { membershipId: 'sam' }, to: { membershipId: 'wren' }, assignment: shift('sams', '2026-03-12T07:00:00Z') },
      { from: { membershipId: 'wren' }, to: { membershipId: 'sam' }, assignment: shift('wrens', '2026-03-20T07:00:00Z') },
    ],
  };

  it('names the shift you give and the one you take', () => {
    expect(givesAndTakes(option, 'wren')).toEqual({ gives: option.legs[1].assignment, takes: option.legs[0].assignment });
  });

  it('ends after the acceptance window, or when its earliest shift starts if that is sooner', () => {
    expect(proposalDeadline(option, 24, NOW).toISOString()).toBe('2026-03-11T09:00:00.000Z');
    expect(proposalDeadline(option, 168, NOW).toISOString()).toBe('2026-03-12T07:00:00.000Z');
  });
});
