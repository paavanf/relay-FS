// rosters.js
// API calls for rosters. Each returns the inner value so components do not
// unwrap twice.

import { api } from '../../../lib/apiClient.js';

// Workers only ever get published rosters back - the server filters, not us.
export async function listRosters(orgId) {
  const result = await api.get(`/orgs/${orgId}/rosters`);
  return result.rosters;
}

// Returns { roster, assignments, unfilledSlots } - everything the grid draws.
export async function getRoster(orgId, rosterId) {
  return api.get(`/orgs/${orgId}/rosters/${rosterId}`);
}

export async function createRoster(orgId, data) {
  const result = await api.post(`/orgs/${orgId}/rosters`, data);
  return result.roster;
}

// Answers 202 with a job id; the work happens on a worker thread.
export async function generateRoster(orgId, rosterId) {
  return api.post(`/orgs/${orgId}/rosters/${rosterId}/generate`, {});
}

export async function publishRoster(orgId, rosterId) {
  const result = await api.post(`/orgs/${orgId}/rosters/${rosterId}/publish`, {});
  return result.roster;
}
