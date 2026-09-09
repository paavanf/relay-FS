// jobs.js
// Reading a background generation job.
//
// Returns { status, progress, metrics, error }. status is one of queued,
// running, completed or failed - polling must stop on the last two.

import { api } from '../../../lib/apiClient.js';

export async function getJob(orgId, jobId) {
  return api.get(`/orgs/${orgId}/jobs/${jobId}`);
}
