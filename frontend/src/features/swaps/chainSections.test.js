// chainSections.test.js
// Which list a proposed swap belongs in on the Swaps page, and how long it
// has left, in words.

import { describe, it, expect } from 'vitest';
import { chainSections } from './chainSections.js';
import { timeLeft, msUntil } from './timeLeft.js';

const NOW = Date.parse('2026-03-10T09:00:00Z');
const chain = (id, rest) => ({ id, youAreIn: true, waitingForYou: false, status: 'proposed', createdAt: '2026-03-09T09:00:00Z', expiresAt: '2026-03-12T09:00:00Z', ...rest });

describe('the three lists of proposed swaps', () => {
  it('puts unanswered proposals first, swaps still going next, and ended ones in history - only chains you are in', () => {
    const chains = [
      chain('later', { waitingForYou: true, expiresAt: '2026-03-13T09:00:00Z' }),
      chain('sooner', { waitingForYou: true, expiresAt: '2026-03-11T09:00:00Z' }),
      chain('mine', {}),
      chain('approval', { status: 'awaiting_approval' }),
      chain('done', { status: 'committed', endedAt: '2026-03-10T08:00:00Z' }),
      chain('off', { status: 'declined', endedAt: '2026-03-10T08:30:00Z' }),
      chain('someone else', { youAreIn: false }),
    ];
    const ids = (list) => list.map((c) => c.id);
    const sections = chainSections(chains);

    expect(ids(sections.waiting)).toEqual(['sooner', 'later']);
    expect(ids(sections.proposals)).toEqual(['mine', 'approval']);
    expect(ids(sections.history)).toEqual(['off', 'done']);
  });
});

describe('time left', () => {
  it.each([
    ['2026-03-12T12:30:00Z', '2 days, 3 hours left'],
    ['2026-03-11T09:00:00Z', '1 day left'],
    ['2026-03-10T14:12:00Z', '5 hours, 12 minutes left'],
    ['2026-03-10T10:00:00Z', '1 hour left'],
    ['2026-03-10T09:40:30Z', '40 minutes left'],
    ['2026-03-10T09:00:20Z', 'Less than a minute left'],
  ])('until %s reads "%s"', (expiresAt, words) => {
    expect(timeLeft(expiresAt, NOW)).toBe(words);
  });

  it('is nothing once the time is up, and never negative', () => {
    expect(timeLeft('2026-03-10T09:00:00Z', NOW)).toBeNull();
    expect(msUntil('2026-03-10T08:00:00Z', NOW)).toBe(0);
  });
});
