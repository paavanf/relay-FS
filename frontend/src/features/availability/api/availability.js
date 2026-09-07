// availability.js
// API calls for the signed-in user's own availability.
//
// The PUT replaces the whole set, so callers send the complete list every
// time rather than a single change.

import { api } from '../../../lib/apiClient.js';

export async function getMyAvailability(orgId) {
  const result = await api.get(`/orgs/${orgId}/availability/me`);
  return result.entries;
}

export async function setMyAvailability(orgId, entries) {
  const result = await api.put(`/orgs/${orgId}/availability/me`, { entries });
  return result.entries;
}
