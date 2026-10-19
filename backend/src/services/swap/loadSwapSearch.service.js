// loadSwapSearch.service.js
// Everything one swap search needs, loaded once and flattened into the
// plain objects the engine takes - the way generation loads its input.
//
//   offers        every open request whose shift has not started, from
//                 people still on the team who still hold that shift
//   assignments   every published shift within SWAP_SEARCH.contextDays of an
//                 offered one: enough of each receiver's weeks for rest,
//                 consecutive days and weekly hours. Drafts are proposals,
//                 not commitments, so they stay out.
//   context       workers, templates, coverage, availability and rules, from
//                 the same loader manual edits and generation use
//   fairnessDebt  the ledger as it stands, in the map the generator reads

import { Organisation, SwapRequest, Assignment, Roster, FairnessLedger } from '../../models/index.js';
import { loadOrgSchedulingData, toEngineContext } from '../roster/orgSchedulingData.service.js';
import { toFairnessDebt } from '../../engine/index.js';
import { DEFAULT_FAIRNESS_POLICY } from '../../config/fairness.js';
import { DEFAULT_SWAP_POLICY, SWAP_SEARCH } from '../../config/swaps.js';
import { toEngineAssignment } from '../roster/toEngineAssignment.js';
import { filtersOf } from './shiftFilters.js';

const DAY_MS = 86_400_000;

export const toOffer = (r) => ({
  id: String(r._id),
  membershipId: String(r.membershipId),
  assignmentId: String(r.assignmentId),
  filters: filtersOf(r.acceptableShiftFilters),
});

async function publishedAround(orgId, offered) {
  if (offered.length === 0) return [];
  const margin = SWAP_SEARCH.contextDays * DAY_MS;
  const from = new Date(Math.min(...offered.map((a) => a.startsAt.getTime())) - margin);
  const to = new Date(Math.max(...offered.map((a) => a.endsAt.getTime())) + margin);

  const rosters = await Roster.find({ orgId, status: 'published' }).select('_id').lean();
  return Assignment.find({ orgId, rosterId: { $in: rosters.map((r) => r._id) }, startsAt: { $gte: from, $lte: to } }).lean();
}

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
  const holder = new Map(offered.map((a) => [String(a._id), String(a.membershipId)]));
  const offers = open.map(toOffer).filter((o) => onTeam.has(o.membershipId) && holder.get(o.assignmentId) === o.membershipId);

  const [around, fairnessDebt] = await Promise.all([publishedAround(orgId, offered), currentDebt(orgId)]);

  return {
    request: toOffer(request),
    offers,
    assignments: around.map(toEngineAssignment),
    context: toEngineContext(data),
    templates: data.shiftTemplates,
    fairnessDebt,
    fairnessPolicy: DEFAULT_FAIRNESS_POLICY,
    maxLength: org.swapPolicy?.maxChainLength ?? DEFAULT_SWAP_POLICY.maxChainLength,
    topN: SWAP_SEARCH.topN,
    limits: SWAP_SEARCH.limits,
  };
}
