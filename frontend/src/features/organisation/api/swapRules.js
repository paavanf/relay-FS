// swapRules.js
// API calls for the organisation's swap rules: how long people have to
// accept a proposed swap, whether a manager approves it, and the longest
// chain the finder suggests. Everyone may read them; managers change them,
// all three together.

import { api } from '../../../lib/apiClient.js';

export async function getSwapRules(orgId) {
  const result = await api.get(`/orgs/${orgId}/swap-rules`);
  return result.swapRules;
}

export async function updateSwapRules(orgId, rules) {
  const result = await api.put(`/orgs/${orgId}/swap-rules`, rules);
  return result.swapRules;
}
