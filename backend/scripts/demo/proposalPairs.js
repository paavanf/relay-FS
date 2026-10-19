// proposalPairs.js
// Picks two direct swaps for the demo's proposals, from people none of
// whom already has a shift in the swap cases, so the cases' answers never
// change. The engine decides which pairs are legal - the same full check of
// both people's weeks the finder makes - and pairs whose earliest shift is
// latest go first, so the proposals last as long as they can. Ties go by
// shift ids, so every run picks the same pairs.
//
// Four different people when the ward has two such swaps. In this ward it
// does not - most hand-overs between the remaining people break a rest or
// hours rule - so the two swaps may share one person, never a shift.

import { findSwapOptions } from '../../src/engine/index.js';

const latestFirst = (a, b) => b.startsAt.localeCompare(a.startsAt) || a.id.localeCompare(b.id);
const offerOf = (assignment) => ({ id: `offer:${assignment.id}`, membershipId: assignment.membershipId, assignmentId: assignment.id });

/**
 * @param {Object} input  engine assignments and context, the dates ahead, and the
 *   membership ids to leave out (everyone with an offer already)
 * @returns {[Object, Object][]}  two pairs of assignments, each a legal direct swap
 */
export function pickProposalPairs({ assignments, context, dates, leaveOut }) {
  const ahead = new Set(dates);
  const candidates = assignments.filter((a) => ahead.has(a.date) && !leaveOut.has(a.membershipId)).sort(latestFirst);
  const offers = candidates.map(offerOf);
  const byOfferId = new Map(candidates.map((a) => [`offer:${a.id}`, a]));
  const startOf = (pair) => [pair[0].startsAt, pair[1].startsAt].sort()[0];

  const pairs = [];
  for (const offer of offers) {
    const { direct } = findSwapOptions({ request: offer, offers, assignments, context, maxLength: 2, topN: Infinity });
    for (const option of direct) pairs.push([byOfferId.get(offer.id), byOfferId.get(option.offerIds[1])]);
  }
  pairs.sort((a, b) => startOf(b).localeCompare(startOf(a)) || `${a[0].id}${a[1].id}`.localeCompare(`${b[0].id}${b[1].id}`));

  for (const shared of [0, 1]) {
    for (const first of pairs) {
      for (const second of pairs) {
        const both = [...first, ...second];
        const shifts = new Set(both.map((a) => a.id));
        const people = new Set(both.map((a) => a.membershipId));
        if (shifts.size === 4 && people.size === 4 - shared) return [first, second];
      }
    }
  }
  throw new Error('The seed found no two direct swaps ahead for the demo proposals.');
}
