// fairness.js
// API calls for the fairness ledger (Milestone 6).
//
// The server decides how much each caller sees: a manager gets every member,
// a worker gets only their own figures and the team average. Nothing here, or
// in the page, filters anything out - there is nothing extra to filter.

import { api } from '../../../lib/apiClient.js';

export function getFairness(orgId) {
  return api.get(`/orgs/${orgId}/fairness`);
}

/** Managers and owners only; returns the fresh ledger in the same shape. */
export function recomputeFairness(orgId) {
  return api.post(`/orgs/${orgId}/fairness/recompute`);
}
