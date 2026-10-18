// chainSentences.js
// A swap option as sentences - the plain-language version of the diagram,
// and what a screen reader reads instead of it:
//
//   "Asha takes your night shift on Saturday 21 March. You take Ravi's
//    evening shift on Tuesday 17 March. Ravi takes Asha's day shift on
//    Friday 20 March."
//
// It starts with the requester's own shift being taken - what they came to
// find - then follows the chain round. When the person looking is the one
// who offered the shift, they are "you"; a manager reading someone else's
// options sees names throughout.

import { shiftPhrase } from './shiftWords.js';

// First names, unless two people in the option share one.
function shortNames(legs) {
  const people = new Map(legs.flatMap((leg) => [leg.from, leg.to]).map((p) => [p.membershipId, p.name ?? 'A team member']));
  const first = (name) => name.split(' ')[0];
  const firsts = [...people.values()].map(first);
  return new Map([...people].map(([id, name]) => [id, firsts.filter((f) => f === first(name)).length > 1 ? name : first(name)]));
}

/** @returns {string[]} one sentence per hand-over */
export function chainSentences(option, { requesterId, viewerIsRequester }) {
  const names = shortNames(option.legs);
  const isYou = (person) => viewerIsRequester && person.membershipId === requesterId;
  const takes = (person) => (isYou(person) ? 'You take' : `${names.get(person.membershipId)} takes`);
  const whose = (person) => (isYou(person) ? 'your' : `${names.get(person.membershipId)}'s`);

  const start = Math.max(0, option.legs.findIndex((leg) => leg.from.membershipId === requesterId));
  const inOrder = [...option.legs.slice(start), ...option.legs.slice(0, start)];
  return inOrder.map((leg) => `${takes(leg.to)} ${whose(leg.from)} ${shiftPhrase(leg.assignment)}.`);
}
