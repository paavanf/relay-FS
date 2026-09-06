// createOrg.js
// API call to create a new organisation. The signed-in user becomes its owner.

import { api } from '../../../lib/apiClient.js';

export async function createOrg({ name, timezone }) {
  return await api.post('/orgs', { name, timezone });
}
