// swapBenchmarkPools.js
// Random pools of offers for benchmark-swaps.js, from a seeded generator, so
// every run asks exactly the same questions and only the timings move.
//
// Written down before the first run, and not to be tuned after it (the
// README repeats it): in the willingness sweep, every offer in a pool says
// it would take a share of shift types and weekdays in return - 100%, 60%,
// 30% or 15%. For a share below 100% it names the k types and m weekdays
// whose k x m / 21 comes nearest the share (a tie is drawn at random), each
// chosen at random: 60% is 12 of the 21 type-and-weekday pairs (57%), 30% is
// 6 (29%), 15% is 3 (14%). 100% names nothing, meaning any shift.

const TYPES = ['day', 'evening', 'night'];
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * Seeded random numbers in [0, 1) - mulberry32, the same small generator the
 * roster generator uses. Kept here so this script needs nothing from inside
 * the engine beyond its public API.
 */
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// `count` of the items (or all, if fewer), chosen at random: a partial Fisher-Yates shuffle.
function pick(items, count, random) {
  const list = [...items];
  for (let i = 0; i < Math.min(count, list.length); i += 1) {
    const j = i + Math.floor(random() * (list.length - i));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, count);
}

/** What one offer would take in return, accepting about `share` of type-and-weekday pairs. */
export function filtersFor(share, random) {
  if (share >= 1) return { categories: [], daysOfWeek: [] };

  const sizes = TYPES.flatMap((_, k) => WEEKDAYS.map((__, m) => ({ k: k + 1, m: m + 1 })));
  const gap = ({ k, m }) => Math.abs((k * m) / (TYPES.length * WEEKDAYS.length) - share);
  const nearest = Math.min(...sizes.map(gap));
  const ties = sizes.filter((size) => gap(size) - nearest < 1e-9);
  const { k, m } = ties[Math.floor(random() * ties.length)];

  return { categories: pick(TYPES, k, random).sort(), daysOfWeek: pick(WEEKDAYS, m, random).sort((a, b) => a - b) };
}

/** `size` different people with shifts, each offering one of their own at random. */
export function poolOf(assignments, size, random) {
  const shiftsOf = new Map();
  for (const a of assignments) shiftsOf.set(a.membershipId, [...(shiftsOf.get(a.membershipId) ?? []), a]);

  return pick([...shiftsOf.keys()].sort(), size, random).map((membershipId) => {
    const own = shiftsOf.get(membershipId);
    const shift = own[Math.floor(random() * own.length)];
    return { id: `offer:${shift.id}`, membershipId, assignmentId: shift.id };
  });
}

/**
 * The same offers, each saying what it would take at `share`. Drawn from its
 * own random stream, so every share asks about exactly the same pools and
 * only the filters differ.
 */
export const withFilters = (offers, share, random) => offers.map((offer) => ({ ...offer, filters: filtersFor(share, random) }));
