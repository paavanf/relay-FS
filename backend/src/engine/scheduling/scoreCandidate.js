// scoreCandidate.js
// How good is putting THIS worker in THIS slot, given the roster so far?
//
// Returns a cost: lower is better, matching the objective function, so the
// generator can always just take the minimum.
//
// Every term is a weight times a measurement. Nothing here is a hard rule -
// legality was already settled by eligibility.js. This only ranks the legal
// options against each other.

import { localDate, daysBetween, localDayOfWeek } from '../time.js';

export function scoreCandidate({
  worker,
  slot,
  assignments,
  context,
  weights,
  remainingSlots = [],
}) {
  return (
    fairnessCost(worker, slot, context, weights) +
    preferenceCost(worker, slot, context, weights) +
    continuityCost(worker, slot, assignments, context, weights) +
    flexibilityCost(worker, slot, remainingSlots, weights)
  );
}

// Someone already over their share should not be first in line for another
// heavy shift. Absent a ledger everyone is neutral, which is the M6 seam.
function fairnessCost(worker, slot, context, weights) {
  const debt = context.fairnessDebt?.[worker.membershipId];
  if (!Number.isFinite(debt) || debt <= 0) return 0;

  return weights.fairnessDebt * debt * slot.burdenWeight;
}

function preferenceCost(worker, slot, context, weights) {
  let cost = 0;

  for (const entry of context.availability ?? []) {
    if (entry.membershipId !== worker.membershipId) continue;
    if (!appliesToSlot(entry, slot)) continue;

    if (entry.status === 'avoid') cost += weights.avoidPenalty;
    if (entry.status === 'prefer') cost -= weights.preferBonus;
  }

  return cost;
}

// People want runs of the same kind of shift. Reward matching an adjacent
// day, charge for switching category across one.
function continuityCost(worker, slot, assignments, context, weights) {
  const templates = context.shiftTemplates ?? [];
  let cost = 0;

  for (const assignment of assignments) {
    if (assignment.membershipId !== worker.membershipId) continue;

    const day = localDate(assignment.startsAt, context.timezone);
    const gap = Math.abs(daysBetween(day, slot.date) ?? 99);
    if (gap !== 1) continue;

    const category = templates.find((t) => t.id === assignment.shiftTemplateId)?.category;
    if (!category) continue;

    cost += category === slot.category ? -weights.continuityBonus : weights.categorySwitchPenalty;
  }

  return cost;
}

// A worker who could still cover many other slots is worth saving for the
// ones nobody else can take, so spending them here is charged more. Counted
// on qualification alone - running the full constraint check for every
// remaining slot would cost more than the ordering it buys.
function flexibilityCost(worker, slot, remainingSlots, weights) {
  let alternatives = 0;

  for (const other of remainingSlots) {
    if (other.slotId === slot.slotId) continue;
    if ((worker.qualificationIds ?? []).includes(other.qualificationId)) alternatives += 1;
  }

  return weights.flexibility * alternatives;
}

function appliesToSlot(entry, slot) {
  const scoped = entry.shiftTemplateId == null || entry.shiftTemplateId === slot.shiftTemplateId;
  if (!scoped) return false;

  if (entry.type === 'exception') return entry.date === slot.date;

  // The slot already carries its local date, so the weekday comes from that
  // rather than being re-derived from the instant in some other zone.
  return entry.dayOfWeek === localDayOfWeek(`${slot.date}T00:00:00Z`, 'utc');
}
