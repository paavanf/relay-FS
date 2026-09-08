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

/**
 * Chronological order, by start instant. Ties break on id so the result is
 * stable no matter what order the caller passed things in - constraints must
 * be order-independent, and a wobbling sort would quietly break that.
 */
export function sortByStart(assignments) {
  return [...assignments].sort((a, b) => {
    const diff = toMillis(a.startsAt) - toMillis(b.startsAt);
    if (diff !== 0) return diff;
    return String(a.id).localeCompare(String(b.id));
  });
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
