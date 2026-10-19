// chainArbitraries.js
// Random swap chains and random runs of events, for the state machine's
// property tests: a chain of two to four people proposed by p0, needing
// approval or not, then up to thirty events - from participants, a
// stranger and a manager - at times that only move forward and run past
// the 48-hour deadline.
//
// Weighted towards moving a chain along (accepting, approving, committing)
// so that runs reach a commit often enough to test it, rather than nearly
// always ending in the first decline; chainStateVacuity.test.js checks it.

import fc from 'fast-check';
import { transition } from '../../../src/engine/index.js';

const HOUR_MS = 3_600_000;
export const START = new Date('2026-03-10T09:00:00Z').getTime();
const DEADLINE_HOURS = 48;

const personArb = fc.constantFrom('p0', 'p1', 'p2', 'p3', 'stranger');

const often = (arbitrary, weight) => ({ arbitrary, weight });

const eventArb = fc.oneof(
  often(personArb.map((membershipId) => ({ type: 'accept', membershipId })), 12),
  often(fc.constant({ type: 'approve', membershipId: 'manager' }), 4),
  often(fc.constant({ type: 'committed' }), 4),
  often(fc.constant({ type: 'commitFailed', reason: 'something changed.' }), 2),
  often(personArb.map((membershipId) => ({ type: 'decline', membershipId })), 1),
  often(personArb.map((membershipId) => ({ type: 'cancel', membershipId })), 1),
  often(fc.constant({ type: 'reject', membershipId: 'manager', reason: 'No.' }), 1),
  often(fc.constant({ type: 'expire' }), 1),
);

// Each step comes 0 to 8 hours after the one before, so a long run passes
// the deadline and a short one does not.
export const scenarioArb = fc.record({
  size: fc.integer({ min: 2, max: 4 }),
  requiresApproval: fc.boolean(),
  steps: fc.array(fc.record({ event: eventArb, gapHours: fc.integer({ min: 0, max: 8 }) }), { minLength: 4, maxLength: 30 }),
});

export function proposed({ size, requiresApproval }) {
  const people = Array.from({ length: size }, (_, i) => `p${i}`);
  return {
    status: 'proposed',
    proposerId: 'p0',
    requiresApproval,
    expiresAt: new Date(START + DEADLINE_HOURS * HOUR_MS),
    reservationsHeld: true,
    approvedBy: null,
    endedBy: null,
    legs: people.map((membershipId, i) => ({ membershipId, acceptedAt: i === 0 ? new Date(START) : null })),
  };
}

/** Plays a scenario, calling visit(chain, event, result) after every step. Returns the last chain. */
export function play(scenario, visit = () => {}) {
  let chain = proposed(scenario);
  let hours = 0;

  for (const { event, gapHours } of scenario.steps) {
    hours += gapHours;
    const before = chain;
    const result = transition(chain, event, new Date(START + hours * HOUR_MS));
    if (result.ok) chain = result.chain;
    visit(chain, event, result, before);
  }
  return chain;
}
