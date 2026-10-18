// handOverTerms.js
// What one hand-over - a taker takes an offered shift and gives their own
// away - adds to a chain's score. Apart from the chain's size, every part of
// a score belongs to exactly one hand-over:
//
//   preference  the taken shift falls on a day or shift the taker marked
//               avoid (or prefer)
//   fairness    the taker's distance from a fair share (|debt|), before
//               minus after: they lose their own shift's burden and gain
//               the taken one's
//
// So a chain's score is perPerson × its size plus its hand-overs' terms
// added up (rankChains.js), and each term is worked out once per search.
//
// "Marked avoid or prefer" is read through the constraint engine's own rule
// (preferenceMatch.appliesTo) and burden through the ledger's (burdenOf), so
// neither is defined twice.

import { burdenOf } from '../fairness/burdenOf.js';
import { appliesTo } from '../constraints/soft/preferenceMatch.js';
import { localDate, localDayOfWeek } from '../time.js';

/** Returns termsFor(taker, taken) -> { avoided, preferred, gain }, remembered per pair of offers. */
export function createHandOverTerms({ assignmentsById, context, fairnessDebt = {}, fairnessPolicy = {} }) {
  const templates = new Map((context.shiftTemplates ?? []).map((t) => [t.id, t]));
  const wishes = new Map(); // membershipId -> their avoid and prefer entries
  for (const entry of context.availability ?? []) {
    if (entry.status !== 'avoid' && entry.status !== 'prefer') continue;
    wishes.set(entry.membershipId, [...(wishes.get(entry.membershipId) ?? []), entry]);
  }
  const burdens = new Map();
  const terms = new Map();

  function burden(assignmentId) {
    if (!burdens.has(assignmentId)) {
      const assignment = assignmentsById.get(assignmentId);
      burdens.set(assignmentId, burdenOf(assignment, templates.get(assignment.shiftTemplateId), fairnessPolicy, context.timezone));
    }
    return burdens.get(assignmentId);
  }

  function preferences(taker, taken) {
    const moved = { ...assignmentsById.get(taken.assignmentId), membershipId: taker.membershipId };
    const date = localDate(moved.startsAt, context.timezone);
    const dayOfWeek = localDayOfWeek(moved.startsAt, context.timezone);
    let avoided = 0;
    let preferred = 0;
    for (const entry of wishes.get(taker.membershipId) ?? []) {
      if (!appliesTo(entry, moved, date, dayOfWeek)) continue;
      if (entry.status === 'avoid') avoided += 1;
      else preferred += 1;
    }
    return { avoided, preferred };
  }

  return function termsFor(taker, taken) {
    const key = `${taker.id}>${taken.id}`;
    if (!terms.has(key)) {
      const debt = fairnessDebt[taker.membershipId] ?? 0;
      const gain = Math.abs(debt) - Math.abs(debt - burden(taker.assignmentId) + burden(taken.assignmentId));
      terms.set(key, { ...preferences(taker, taken), gain });
    }
    return terms.get(key);
  };
}
