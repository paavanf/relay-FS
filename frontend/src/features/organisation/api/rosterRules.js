// rosterRules.js
// API calls for the organisation's scheduling rules.
// Each returns the inner object so components do not unwrap twice.

import { api } from '../../../lib/apiClient.js';

export async function getRosterRules(orgId) {
  const result = await api.get(`/orgs/${orgId}/roster-rules`);
  return result.rosterRules;
}

// All three rules go together. The server rejects a partial update, because
// a rule it cannot read is one the scheduler stops enforcing entirely.
export async function updateRosterRules(orgId, rules) {
  const result = await api.put(`/orgs/${orgId}/roster-rules`, rules);
  return result.rosterRules;
}
