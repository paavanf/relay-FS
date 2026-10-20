// passwordQueue.test.js
// At most two password hashes or checks run at once (src/utils/passwords.js).
// A burst of sign-ins waits its turn, first come, first served, and every
// one is answered - even when one of them fails. argon2 is replaced by a
// stand-in that counts how many are running, so no real hashing happens.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hashPassword, verifyPassword, MAX_AT_ONCE } from '../../src/utils/passwords.js';

const argon = vi.hoisted(() => ({ running: 0, most: 0, finished: [] }));

vi.mock('argon2', () => {
  // Each stand-in hash or check takes a few milliseconds, as the real ones take longer.
  const work = async (label) => {
    argon.running += 1;
    argon.most = Math.max(argon.most, argon.running);
    await new Promise((resolve) => setTimeout(resolve, 15));
    argon.running -= 1;
    if (label === 'broken') throw new Error('pchstr must contain a $ as first char');
    argon.finished.push(label);
    return true;
  };
  return { default: { argon2id: 2, hash: (password) => work(password), verify: (_hash, password) => work(password) } };
});

beforeEach(() => {
  argon.running = 0;
  argon.most = 0;
  argon.finished = [];
});

describe('the password queue', () => {
  it('runs at most two at once, in the order they arrived, and answers every one', async () => {
    const labels = Array.from({ length: 10 }, (_, i) => `sign-in ${i}`);
    const answers = await Promise.all(labels.map((label, i) => (i % 2 ? hashPassword(label) : verifyPassword('stored', label))));

    expect(MAX_AT_ONCE).toBe(2);
    expect(answers).toEqual(labels.map(() => true));
    expect(argon.most).toBe(2);
    expect(argon.finished).toEqual(labels);
  });

  it('frees the slot of one that fails, so the rest still run', async () => {
    const results = await Promise.allSettled(['first', 'broken', 'third', 'fourth'].map((label) => verifyPassword('stored', label)));

    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'rejected', 'fulfilled', 'fulfilled']);
    expect(argon.finished).toEqual(['first', 'third', 'fourth']);
    expect(argon.most).toBe(2);
  });
});
