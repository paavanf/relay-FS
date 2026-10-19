// jobs.js
// Reading a background generation job.
//
// Returns { status, progress, metrics, error }. status is one of queued,
// running, completed or failed - polling must stop on the last two.
// Generation has its own progress display, so a slow poll never shows the
// "starting the server" banner (expectSlow).

import { api } from '../../../lib/apiClient.js';

export async function getJob(orgId, jobId) {
  return api.get(`/orgs/${orgId}/jobs/${jobId}`, { expectSlow: true });
}
