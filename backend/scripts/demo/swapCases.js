// swapCases.js
// Picks the demo's swap requests from the published weeks ahead, and uses
// the real swap finder to prove each of the three that matter does what it
// is there for:
//
//   chain   only a three-person chain resolves it - there is no direct swap
//   direct  a direct swap resolves it
//   none    nothing does, for a reason anyone can follow: Grace works Monday
//           to Wednesday only, and the other offers fall on days she cannot
//
// Only nurses' shifts that are always a registered nurse's place are used -
// evenings, nights, and the day shifts of nurses who are not charge nurses -
// so whoever takes one leaves it properly staffed. (The engine checks only
// that someone holds a qualification a shift calls for, so it would also let
// a healthcare assistant take a nurse's day shift. The demo should not show
// that.)
//
// How: each candidate's options among all the others show its three-person
// chains and who it could swap with directly. A chain whose first person
// could swap directly with neither of the other two is a chain-only case.
// Pools are then tried - those three and Grace, plus a pair with a direct
// swap if the three have none between them - and every outcome is checked
// again on exactly that pool, since each offer can open options for the
// others. A request closes when its shift starts, so pools whose earliest
// shift is latest go first: the demo keeps working as long as it can after a
// reseed. Ties go by offer ids, so every run keeps the same pool.

import { findSwapOptions } from '../../src/engine/index.js';

const latestFirst = (a, b) => b.startsAt.localeCompare(a.startsAt) || a.membershipId.localeCompare(b.membershipId);
const keyOf = (pool) => pool.map((offer) => offer.id).join(' ');
const offerOf = (assignment) => ({ id: `offer:${assignment.id}`, membershipId: assignment.membershipId, assignmentId: assignment.id });
const distinctPeople = (offers) => new Set(offers.map((offer) => offer.membershipId)).size === offers.length;

/**
 * @param {Object} input  engine assignments and context, the dates ahead,
 *   the org's maxLength, and who is who: Sets of nurse and charge-nurse
 *   membership ids, Grace's id, and the day shift's template id
 * @returns {{ pool: Object[], chain: Object, direct: Object, none: Object }}
 *   pool is every offer to store; chain, direct and none are the three to show
 */
export function pickSwapCases({ assignments, context, dates, maxLength, nurses, chargeNurses, grace, dayTemplateId }) {
  const ahead = new Set(dates);
  const candidates = assignments
    .filter((a) => ahead.has(a.date) && nurses.has(a.membershipId) && a.membershipId !== grace)
    .filter((a) => !(a.shiftTemplateId === dayTemplateId && chargeNurses.has(a.membershipId)))
    .sort(latestFirst)
    .map(offerOf);
  const graces = assignments.filter((a) => a.membershipId === grace && ahead.has(a.date)).sort(latestFirst).map(offerOf)[0];
  if (!graces) throw new Error('The seed found no shift ahead for Grace to offer.');

  const byId = new Map(candidates.map((offer) => [offer.id, offer]));
  const optionsFor = (request, pool, wider = {}) => findSwapOptions({ request, offers: pool, assignments, context, maxLength, ...wider });

  // What each candidate could do among all of them: every chain of up to three, nothing cut off.
  const among = new Map(candidates.map((offer) => [offer.id, optionsFor(offer, candidates, { maxLength: 3, topN: Infinity })]));
  const partners = (offer) => new Set(among.get(offer.id).direct.map((chain) => chain.offerIds[1]));
  const directPairs = candidates.flatMap((p) => [...partners(p)].map((qId) => [p, byId.get(qId)]));

  function proves(pool) {
    const [x] = pool;
    const chain = optionsFor(x, pool);
    if (chain.direct.length > 0 || chain.chains[0]?.size !== 3) return null;
    const none = optionsFor(graces, pool);
    if (none.direct.length + none.chains.length > 0) return null;
    const direct = pool.slice(1, -1).find((offer) => optionsFor(offer, pool).direct.length > 0);
    return direct ? { pool, chain: x, direct, none: graces } : null;
  }

  const pools = [];
  for (const x of candidates) {
    for (const chain of among.get(x.id).chains) {
      const [y, z] = chain.offerIds.slice(1).map((id) => byId.get(id));
      if (partners(x).has(y.id) || partners(x).has(z.id)) continue;
      pools.push([x, y, z, graces], ...directPairs.map(([p, q]) => [x, y, z, p, q, graces]));
    }
  }

  const startOf = new Map(assignments.map((a) => [a.id, a.startsAt]));
  const openUntil = (pool) => pool.map((offer) => startOf.get(offer.assignmentId)).sort()[0];
  const longestLasting = (a, b) => openUntil(b).localeCompare(openUntil(a)) || keyOf(a).localeCompare(keyOf(b));

  for (const pool of pools.filter(distinctPeople).sort(longestLasting)) {
    const cases = proves(pool);
    if (cases) return cases;
  }
  throw new Error('The seed found no chain-only swap among the nurse shifts ahead.');
}
