// coverage.js
// API calls for coverage requirements (how many of each qualification a
// shift needs on a given weekday).

import { api } from '../../../lib/apiClient.js';

export async function listCoverage(orgId) {
  const result = await api.get(`/orgs/${orgId}/coverage`);
  return result.coverage;
}

// PUT, not POST: this is an idempotent upsert keyed by
// (shiftTemplateId, dayOfWeek). Sending it twice leaves the same state.
export async function upsertCoverage(orgId, data) {
  const result = await api.put(`/orgs/${orgId}/coverage`, data);
  return result.coverage;
}

export async function deleteCoverage(orgId, coverageId) {
  return api.delete(`/orgs/${orgId}/coverage/${coverageId}`);
}
