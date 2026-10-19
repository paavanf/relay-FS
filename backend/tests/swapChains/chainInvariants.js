// chainInvariants.js
// What must hold after every swap chain test, whatever it did - checked
// against the database itself, not the API's answers:
//
//   no shift is held by two chains, a reserved shift belongs to a live
//   chain that includes it, and an ended chain holds nothing
//   nobody is double-booked
//   every shift's places, role by role, are exactly as many as before -
//   a commit only ever changes who holds them
//   there are exactly as many shifts as before
//
// Take a snapshot() before the test and pass it to expectInvariants().

import { expect } from 'vitest';
import { Assignment, AuditLog, SwapChain, SwapRequest } from '../../src/models/index.js';
import { TERMINAL_CHAIN_STATUSES } from '../../src/engine/index.js';

function placesByRole(assignments) {
  const counts = {};
  for (const a of assignments) {
    const key = `${a.rosterId}|${a.shiftTemplateId}|${a.date}|${a.slotQualificationId}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export async function snapshot() {
  const assignments = await Assignment.find().lean();
  return { count: assignments.length, places: placesByRole(assignments) };
}

function expectNobodyDoubleBooked(assignments) {
  const byPerson = Map.groupBy(assignments, (a) => String(a.membershipId));
  for (const [person, shifts] of byPerson) {
    const sorted = [...shifts].sort((a, b) => a.startsAt - b.startsAt);
    sorted.slice(1).forEach((shift, i) => expect(shift.startsAt >= sorted[i].endsAt, `${person} double-booked`).toBe(true));
  }
}

function expectReservationsHonest(assignments, chains) {
  const live = new Map(chains.filter((c) => !TERMINAL_CHAIN_STATUSES.includes(c.status)).map((c) => [String(c._id), c]));

  const heldByLiveChains = [...live.values()].flatMap((c) => c.legs.map((leg) => String(leg.givesAssignmentId)));
  expect(new Set(heldByLiveChains).size, 'a shift in two live chains').toBe(heldByLiveChains.length);

  for (const shift of assignments.filter((a) => a.reservedByChainId)) {
    const chain = live.get(String(shift.reservedByChainId));
    expect(chain, 'a shift reserved by a chain that has ended').toBeDefined();
    expect(chain.legs.some((leg) => String(leg.givesAssignmentId) === String(shift._id))).toBe(true);
  }
  for (const chain of chains.filter((c) => TERMINAL_CHAIN_STATUSES.includes(c.status))) {
    expect(chain.reservationsHeld, `${chain.status} chain still holding shifts`).toBe(false);
  }
}

export async function expectInvariants(before) {
  const [assignments, chains] = await Promise.all([Assignment.find().lean(), SwapChain.find().lean()]);

  expect(assignments.length, 'total shifts').toBe(before.count);
  expect(placesByRole(assignments), 'places per shift and role').toEqual(before.places);
  expectNobodyDoubleBooked(assignments);
  expectReservationsHonest(assignments, chains);
}

/** Who holds each shift now, for expectNothingChanged. */
export async function holdersNow() {
  return new Map((await Assignment.find().lean()).map((a) => [String(a._id), String(a.membershipId)]));
}

/** A chain that ended without happening: every shift where it was, none reserved, every offer open again. */
export async function expectNothingChanged(chainId, status, holders, openOffers) {
  expect((await SwapChain.findById(chainId).lean()).status).toBe(status);
  for (const shift of await Assignment.find().lean()) {
    expect(String(shift.membershipId), 'a shift changed hands').toBe(holders.get(String(shift._id)));
    expect(shift.reservedByChainId).toBeNull();
  }
  expect(await SwapRequest.countDocuments({ status: 'matched' })).toBe(0);
  expect(await SwapRequest.countDocuments({ status: 'open' })).toBe(openOffers);
}

/** A committed chain, committed exactly once: one commit entry, every shift moved once to the right person. */
export async function expectCommittedOnce(chainId) {
  const stored = await SwapChain.findById(chainId).lean();
  expect(stored.status).toBe('committed');
  expect(await AuditLog.countDocuments({ chainId, action: 'swap.committed' })).toBe(1);
  expect(await AuditLog.countDocuments({ chainId, action: 'shift.transferred' })).toBe(stored.legs.length);

  for (const leg of stored.legs) {
    const shift = await Assignment.findById(leg.receivesAssignmentId).lean();
    expect(String(shift.membershipId)).toBe(String(leg.membershipId));
    expect(shift).toMatchObject({ version: 1, reservedByChainId: null, source: 'swap' });
  }
}
