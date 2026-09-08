// random.js
// A tiny seedable pseudo-random generator (mulberry32).
//
// The engine must never call Math.random(). Two reasons: the same input and
// seed have to produce the same roster, or a bug cannot be reproduced from a
// job record; and a test that fails one run in fifty is worse than no test.
//
// mulberry32 is 32-bit, fast, and good enough for choosing which move to try
// next. It is not cryptographic and must never be used where that matters.

export function createRandom(seed) {
  // Force to a 32-bit integer so a float or a negative seed still behaves.
  let state = Math.trunc(seed) >>> 0;

  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A whole number in [0, count). */
export function randomIndex(random, count) {
  return Math.floor(random() * count) % Math.max(1, count);
}

/** One item, or undefined for an empty list. */
export function pickOne(random, items) {
  return items.length === 0 ? undefined : items[randomIndex(random, items.length)];
}
