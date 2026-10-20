// memoise.js
// The caches behind the engine's hottest functions (time.js, calendarDays.js).
//
// PERFORMANCE. Generating a fortnight's roster calls the time helpers
// millions of times, and a Luxon parse costs tens of microseconds. Memoising
// is safe because every function cached here is pure, and it pays because the
// inputs repeat constantly - the same few hundred instants, over and over,
// for the whole run. Before this, evaluating a 150-assignment roster took
// 90ms, which made generation take minutes rather than seconds.

// Bounded so a long-lived process cannot grow one of these without limit. The
// working set is tiny - a roster has a few hundred distinct instants - so the
// cap is never reached in practice and exists purely as a safety net.
const CACHE_LIMIT = 20_000;

/** compute(key, first, second), remembered by key. */
export function memoise(compute) {
  const cache = new Map();

  // One lookup on a hit, and the two extra arguments named rather than
  // spread: this runs millions of times, and both showed up in profiles.
  // Nothing memoised here ever computes undefined, so it can mean "missing".
  return (key, first, second) => {
    const hit = cache.get(key);
    if (hit !== undefined) return hit;

    const value = compute(key, first, second);
    if (cache.size >= CACHE_LIMIT) cache.clear();
    cache.set(key, value);
    return value;
  };
}

// Same idea for two arguments: one cache per first argument, so a lookup
// never builds a combined key. Joining the two into one string on every call
// - and hashing that new string - was most of the cost of the whole engine
// in a swap search's profile. The arguments themselves are strings the
// callers already hold, whose hashes are kept.
export function memoiseTwo(compute) {
  const caches = new Map();
  let size = 0;

  return (first, second) => {
    let cache = caches.get(first);
    if (cache === undefined) {
      cache = new Map();
      caches.set(first, cache);
    }
    const hit = cache.get(second);
    if (hit !== undefined) return hit;

    const value = compute(first, second);
    if (size >= CACHE_LIMIT) {
      caches.clear();
      size = 0;
      cache = new Map();
      caches.set(first, cache);
    }
    cache.set(second, value);
    size += 1;
    return value;
  };
}
