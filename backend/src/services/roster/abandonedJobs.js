// abandonedJobs.js
// A generation job whose server stopped part-way - a deploy, a restart -
// stays `queued` or `running` with nobody left to finish it. Once it is older
// than the longest a run can take (GENERATION_DEADLINE_MS), nothing can still
// be working on it, on this server or any other, so it is recorded as failed:
// the page polling it says so instead of waiting for ever. The organisation's
// claim runs out by the same deadline (generationClaim.js), so a new run can
// start.

import { GenerationJob } from '../../models/index.js';
import { GENERATION_DEADLINE_MS } from '../../config/constants.js';

export const ABANDONED = 'This run did not finish: the server stopped while it was working. Generate the roster again.';

/** Records abandoned jobs as failed - one organisation's job, or every one (at start-up). Resolves to how many. */
export async function failAbandonedJobs({ orgId, jobId, now = new Date() } = {}) {
  const filter = {
    status: { $in: ['queued', 'running'] },
    createdAt: { $lte: new Date(now.getTime() - GENERATION_DEADLINE_MS) },
  };
  if (orgId) filter.orgId = orgId;
  if (jobId) filter._id = jobId;
  const result = await GenerationJob.updateMany(filter, { $set: { status: 'failed', error: ABANDONED, finishedAt: now } });
  return result.modifiedCount;
}
