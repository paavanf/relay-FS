// swapArbitraries.js
// Random swap situations for the property tests.
//
// Each case is a random ward (scenarioArbitraries.js - the same worlds the
// generation properties use), a roster the real generator built for it - so
// every case starts from a legal roster - and a random handful of its people
// each offering one of their own shifts, one of them asking for options.

import fc from 'fast-check';
import { generateRoster } from '../../../src/engine/scheduling/generateRoster.js';
import { scenarioArb, contextOf } from './scenarioArbitraries.js';

// One offer per person, picked by the random numbers in `picks`.
function pickOffers(assignments, picks) {
  const byWorker = new Map();
  for (const a of assignments) byWorker.set(a.membershipId, [...(byWorker.get(a.membershipId) ?? []), a]);
  const people = [...byWorker.keys()].sort();
  if (people.length === 0) return [];

  const offers = [];
  const taken = new Set();
  for (const pick of picks) {
    const who = people[pick % people.length];
    if (taken.has(who)) continue;
    taken.add(who);
    const own = byWorker.get(who);
    const shift = own[Math.floor(pick / people.length) % own.length];
    offers.push({ id: `o:${shift.id}`, membershipId: who, assignmentId: shift.id });
  }
  return offers;
}

export const swapCaseArb = fc
  .record({
    input: scenarioArb,
    picks: fc.array(fc.nat({ max: 10_000 }), { minLength: 2, maxLength: 10 }),
    requesterIndex: fc.nat({ max: 50 }),
    maxLength: fc.integer({ min: 2, max: 4 }),
  })
  .map(({ input, picks, requesterIndex, maxLength }) => {
    const { assignments } = generateRoster(input);
    const offers = pickOffers(assignments, picks);
    return {
      assignments,
      offers,
      request: offers[requesterIndex % Math.max(offers.length, 1)],
      context: contextOf(input),
      maxLength,
    };
  });

// The same cases with something to rank by: a fairness debt for each person
// (-6 to +6, in half points), and days some of them would avoid or prefer.
// Neither changes what is legal, so every roster is still legal.
export const rankedCaseArb = fc
  .record({
    base: swapCaseArb,
    debts: fc.array(fc.integer({ min: -12, max: 12 }), { minLength: 14, maxLength: 14 }),
    wishes: fc.array(fc.record({ who: fc.nat({ max: 13 }), dayOfWeek: fc.nat({ max: 6 }), status: fc.constantFrom('avoid', 'prefer') }), { maxLength: 12 }),
  })
  .map(({ base, debts, wishes }) => {
    const people = base.context.workers.map((w) => w.membershipId);
    const extra = wishes
      .filter((wish) => wish.who < people.length)
      .map((wish) => ({ membershipId: people[wish.who], type: 'recurring', dayOfWeek: wish.dayOfWeek, shiftTemplateId: null, status: wish.status, date: null }));
    return {
      ...base,
      fairnessDebt: Object.fromEntries(people.map((id, i) => [id, debts[i] / 2])),
      context: { ...base.context, availability: [...base.context.availability, ...extra] },
    };
  });

// The same cases with "what would you take in return?" filled in at random:
// each offer may name some kinds of shift and some weekdays, and either list
// can be empty, meaning any. Filters only narrow who is willing, so every
// roster is still legal.
export const filteredCaseArb = fc
  .record({
    base: swapCaseArb,
    filters: fc.array(fc.record({ categories: fc.subarray(['day', 'evening', 'night']), daysOfWeek: fc.subarray([0, 1, 2, 3, 4, 5, 6]) }), {
      minLength: 10,
      maxLength: 10,
    }),
  })
  .map(({ base, filters }) => {
    const offers = base.offers.map((offer, i) => ({ ...offer, filters: filters[i] }));
    return { ...base, offers, request: offers.find((offer) => offer.id === base.request?.id) };
  });
