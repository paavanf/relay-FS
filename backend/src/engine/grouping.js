// grouping.js
// Small shared helpers. Almost every constraint asks the same two questions
// first - "whose assignments are these?" and "in what order?" - so they live
// here rather than being rewritten six times.

import { toMillis } from './time.js';

/** Groups assignments by worker. Returns a Map of membershipId -> assignments. */
export function byMembership(assignments) {
  const groups = new Map();

  for (const assignment of assignments) {
    const existing = groups.get(assignment.membershipId);
    if (existing) {
      existing.push(assignment);
    } else {
      groups.set(assignment.membershipId, [assignment]);
    }
  }

  return groups;
}

/** Plain code-point comparison of two ids - unlike localeCompare, the same on every machine. */
export function compareIds(a, b) {
  const x = String(a);
  const y = String(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

// A time that will not parse orders as the epoch, so bad data still sorts
// the same way every time (evaluate() reports it separately).
const orderMillis = (iso) => toMillis(iso) ?? 0;

/**
 * The engine's one chronological order: start instant, then end instant,
 * then id. Every ordering of shifts or slots by time uses it (dates, which
 * cannot tie, are sorted as plain strings). It has to be
 * complete - two shifts can start at the same instant (a double booking), and
 * a tie left to the input order makes the answer depend on the order the
 * assignments arrived in, which the engine promises it never does.
 * idOf names the stable id for things not keyed by `id` (a slot's slotId).
 */
export function compareByTime(a, b, idOf = (item) => item.id) {
  return (
    orderMillis(a.startsAt) - orderMillis(b.startsAt) ||
    orderMillis(a.endsAt) - orderMillis(b.endsAt) ||
    compareIds(idOf(a), idOf(b))
  );
}

/** Chronological order (compareByTime), as a new array. */
export function sortByStart(assignments) {
  return [...assignments].sort((a, b) => compareByTime(a, b));
}

/** Indexes any array of objects by one of its string fields. */
export function indexBy(items, key) {
  const index = new Map();
  for (const item of items) index.set(item[key], item);
  return index;
}

/**
 * A rule value only counts if it is a usable positive number. A missing or
 * nonsensical limit means "not configured", and a constraint that cannot be
 * evaluated must stay silent rather than invent a default and reject a roster
 * for a rule nobody set.
 */
export function isUsableLimit(value) {
  return Number.isFinite(value) && value >= 0;
}

// Hours are floating point, so a shift that lands exactly on a limit can come
// out as 40.000000000000004. Compare against limits with this slack.
export const EPSILON = 1e-9;
