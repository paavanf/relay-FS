// swapRequests.js
// API calls for shift swaps (Milestone 7): offering a shift, listing and
// withdrawing offers, and asking for the options on one.
//
// Looking at options never reserves a shift or tells anyone anything, so the
// page can ask as often as someone wants to look. Proposing one of them is
// in swapChains.js.

import { api } from '../../../lib/apiClient.js';

/** A worker's own open offers; a manager's list holds everyone's. Each says whether it is the caller's (mine). */
export async function listSwapRequests(orgId) {
  const result = await api.get(`/orgs/${orgId}/swap-requests`);
  return result.swapRequests;
}

export async function offerShift(orgId, { assignmentId, note, acceptableShiftFilters }) {
  const result = await api.post(`/orgs/${orgId}/swap-requests`, { assignmentId, note, acceptableShiftFilters });
  return result.swapRequest;
}

/** Changes your own open offer: its note, or what you would take in return. */
export async function updateOffer(orgId, requestId, changes) {
  const result = await api.patch(`/orgs/${orgId}/swap-requests/${requestId}`, changes);
  return result.swapRequest;
}

export function withdrawOffer(orgId, requestId) {
  return api.delete(`/orgs/${orgId}/swap-requests/${requestId}`);
}

/** { request, maxLength, direct, chains, noMatch, stats } - direct swaps and longer chains, best first. */
export function getSwapOptions(orgId, requestId) {
  return api.get(`/orgs/${orgId}/swap-requests/${requestId}/options`);
}
