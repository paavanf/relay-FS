// swapCases.js
// Picks the demo's swap requests from the published weeks ahead, and has
// swapCaseChecks.js prove each case on the exact pool chosen:
//
//   chain   a three-person chain resolves it - and only because its owner
//           said what they would take ("only day shifts", say), which rules
//           out the direct swap they would otherwise have
//   direct  a direct swap resolves it
//   none    nothing does, and the reason is Grace's own: she works Monday to
//           Wednesday only, and the other offers fall on days she cannot
//   role    nothing does, because the shift is a charge nurse's place and
//           nobody else offering holds that role
//
// The engine decides all of it, roles included, so no shift needs leaving
// out for realism. Candidates are nurses' shifts (these are nurses' stories),
// and pools whose earliest shift is latest go first - a request closes when
// its shift starts, so the demo keeps working as long as it can after a
// reseed. Ties go by offer ids, so every run keeps the same pool.

import { findSwapOptions } from '../../src/engine/index.js';
import { provesCases } from './swapCaseChecks.js';

const latestFirst = (a, b) => b.startsAt.localeCompare(a.startsAt) || a.membershipId.localeCompare(b.membershipId);
const offerOf = (assignment) => ({ id: `offer:${assignment.id}`, membershipId: assignment.membershipId, assignmentId: assignment.id });
const keyOf = (pool) => pool.map((offer) => offer.id).join(' ');
// The chain's owner, the charge nurse and Grace are each in one offer only. w, the
// direct swap the filter rules out, may be a second shift offered by y or z - in
// this ward the only chains run between the same three nurses.
const castOk = ([x, y, z, w, role, grace]) =>
  new Set([x, y, z, role, grace].map((o) => o.membershipId)).size === 5 && ![x, role, grace].some((o) => o.membershipId === w.membershipId);

/**
 * @param {Object} input  engine assignments and context, the dates ahead, the org's
 *   maxLength, and who is who: a Set of nurse membership ids, Grace's id, and the
 *   charge nurse qualification's id
 * @returns {{ pool: Object[], chain, direct, none, role }}  pool is every offer to store
 */
export function pickSwapCases({ assignments, context, dates, maxLength, nurses, grace, chargeNurseRole }) {
  const ahead = new Set(dates);
  const shiftOf = new Map(assignments.map((a) => [a.id, a]));
  const categoryOf = (offer) => context.shiftTemplates.find((t) => t.id === shiftOf.get(offer.assignmentId).shiftTemplateId)?.category;
  const candidates = assignments.filter((a) => ahead.has(a.date) && nurses.has(a.membershipId) && a.membershipId !== grace).sort(latestFirst).map(offerOf);
  const graces = assignments.filter((a) => a.membershipId === grace && ahead.has(a.date)).sort(latestFirst).map(offerOf)[0];
  if (!graces) throw new Error('The seed found no shift ahead for Grace to offer.');

  const byId = new Map(candidates.map((offer) => [offer.id, offer]));
  const optionsFor = (request, pool, wider = {}) => findSwapOptions({ request, offers: pool, assignments, context, maxLength, ...wider });
  const among = new Map(candidates.map((offer) => [offer.id, optionsFor(offer, candidates, { maxLength: 3, topN: Infinity })]));
  const partners = (offer) => new Set(among.get(offer.id).direct.map((chain) => chain.offerIds[1]));
  const roleShifts = candidates.filter((offer) => shiftOf.get(offer.assignmentId).slotQualificationId === chargeNurseRole);

  const pools = [];
  for (const x of candidates) {
    for (const chain of among.get(x.id).chains) {
      const [y, z] = chain.offerIds.slice(1).map((id) => byId.get(id));
      // x will only take shifts like y's - so y must not be a direct partner, nor z if z's shift is that kind.
      const only = categoryOf(y);
      if (partners(x).has(y.id) || (partners(x).has(z.id) && categoryOf(z) === only)) continue;
      const choosy = { ...x, filters: { categories: [only], daysOfWeek: [] } };
      for (const w of [...partners(x)].map((id) => byId.get(id)).filter((offer) => categoryOf(offer) !== only)) {
        for (const role of roleShifts) pools.push([choosy, y, z, w, role, graces]);
      }
    }
  }

  const startOf = new Map(assignments.map((a) => [a.id, a.startsAt]));
  const openUntil = (pool) => pool.map((offer) => startOf.get(offer.assignmentId)).sort()[0];
  const longestLasting = (a, b) => openUntil(b).localeCompare(openUntil(a)) || keyOf(a).localeCompare(keyOf(b));

  for (const pool of pools.filter(castOk).sort(longestLasting)) {
    const cases = provesCases(pool, optionsFor);
    if (cases) return { ...cases, openUntil: openUntil(pool) };
  }
  throw new Error('The seed found no set of nurse shifts ahead that shows all four swap cases.');
}
