// loadSwapSearch.service.js
// Everything one swap search needs, loaded once and flattened into the
// plain objects the engine takes - the way generation loads its input.
//
//   offers        every open request whose shift has not started, from
//                 people still on the team who still hold that shift - and
//                 only shifts that can be swapped: ones that record their
//                 role (Milestone 7.5), and are not held by a proposed chain
//                 whose time has not run out (Milestone 8)
//   assignments   every published shift near an offered one (publishedAround.js)
//   versions      each of those shifts' version as loaded, so a proposal can
//                 reserve exactly what the search checked
//   context       workers, templates, coverage, availability and rules, from
//                 the same loader manual edits and generation use
//   fairnessDebt  the ledger as it stands, in the map the generator reads

import { Organisation, SwapRequest, Assignment, FairnessLedger } from '../../models/index.js';
import { loadOrgSchedulingData, toEngineContext } from '../roster/orgSchedulingData.service.js';
import { toFairnessDebt } from '../../engine/index.js';
import { DEFAULT_FAIRNESS_POLICY } from '../../config/fairness.js';
import { DEFAULT_SWAP_POLICY, SWAP_SEARCH } from '../../config/swaps.js';
import { toEngineAssignment } from '../roster/toEngineAssignment.js';
import { filtersOf } from './shiftFilters.js';
import { publishedAround } from './publishedAround.js';

export const toOffer = (r) => ({
  id: String(r._id),
  membershipId: String(r.membershipId),
  assignmentId: String(r.assignmentId),
  filters: filtersOf(r.acceptableShiftFilters),
});

/** Can this shift be part of a swap at all? It must record its role, and not be held by a live proposal. */
export const isSwappable = (assignment, now) =>
  Boolean(assignment.slotQualificationId) && !(assignment.reservedByChainId && assignment.reservationExpiresAt > now);

// From the stored ledger - no recompute: ranking reads the same figures the Fairness page shows.
async function currentDebt(orgId) {
  const rows = await FairnessLedger.find({ orgId }).lean();
  if (rows.length === 0) return {};
  const ledger = { teamAverage: rows[0].teamAverage, rows: rows.map((r) => ({ ...r, membershipId: String(r.membershipId) })) };
  return toFairnessDebt(ledger, DEFAULT_FAIRNESS_POLICY);
}

export async function loadSwapSearch({ orgId, request, now }) {
  const org = await Organisation.findById(orgId).lean();
  const data = await loadOrgSchedulingData(org);
  const onTeam = new Set(data.workers.map((w) => w.membershipId));

  const open = await SwapRequest.find({ orgId, status: 'open', startsAt: { $gt: now } }).lean();
  const offered = await Assignment.find({ _id: { $in: open.map((r) => r.assignmentId) } }).lean();
  const usable = new Map(offered.filter((a) => isSwappable(a, now)).map((a) => [String(a._id), String(a.membershipId)]));
  const offers = open.map(toOffer).filter((o) => onTeam.has(o.membershipId) && usable.get(o.assignmentId) === o.membershipId);

  const [around, fairnessDebt] = await Promise.all([publishedAround(orgId, offered), currentDebt(orgId)]);

  return {
    request: toOffer(request),
    offers,
    assignments: around.map(toEngineAssignment),
    versions: new Map(around.map((a) => [String(a._id), a.version ?? 0])),
    context: toEngineContext(data),
    templates: data.shiftTemplates,
    fairnessDebt,
    fairnessPolicy: DEFAULT_FAIRNESS_POLICY,
    maxLength: org.swapPolicy?.maxChainLength ?? DEFAULT_SWAP_POLICY.maxChainLength,
    topN: SWAP_SEARCH.topN,
    limits: SWAP_SEARCH.limits,
  };
}
