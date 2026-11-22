// generateRoster.service.js
// Starts a generation run and returns a job id straight away.
//
// The request must not wait for the work - it takes tens of seconds - so this
// creates a GenerationJob, hands the payload to a worker thread
// (generationJob.js), and returns. The client polls the job.
//
// Refusals worth understanding:
//   a published roster is never regenerated in place. People have arranged
//   childcare around it. Clone it to a new draft instead.
//   one run per organisation at a time - claimed atomically in the database
//   (generationClaim.js), so two requests at once cannot both start one.
//   one worker per server at a time (jobs/runGeneration.js) - reserved before
//   anything is awaited, so two requests at once cannot both take it.

import { Roster, GenerationJob } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { reserveWorker, releaseWorker } from '../../jobs/runGeneration.js';
import { claimGeneration, releaseGeneration } from './generationClaim.js';
import { failAbandonedJobs } from './abandonedJobs.js';
import { runGenerationJob } from './generationJob.js';

export async function startGeneration({ orgId, rosterId, membershipId, seed }) {
  const roster = await Roster.findOne({ _id: rosterId, orgId });
  if (!roster) throw AppError.notFound('Roster not found');

  if (roster.status !== 'draft') {
    throw AppError.conflict(
      `This roster is ${roster.status}. Published rosters cannot be regenerated - clone it to a new draft first.`,
    );
  }

  const claimedAt = new Date();
  const org = await claimGeneration(orgId, claimedAt);
  if (!org) throw AppError.conflict('A generation is already running for this organisation.');

  if (!reserveWorker()) {
    await releaseGeneration(orgId, claimedAt);
    throw AppError.tooManyRequests('The generator is busy. Try again in a moment.');
  }

  try {
    const job = await GenerationJob.create({ orgId, rosterId, requestedBy: membershipId });
    // Deliberately not awaited: the caller gets the job id now and polls. The
    // run gives the worker and the claim back when it ends, however it ends.
    runGenerationJob({ job, org, roster, seed, claimedAt });
    return job;
  } catch (err) {
    releaseWorker();
    await releaseGeneration(orgId, claimedAt);
    throw err;
  }
}

export async function getJob({ orgId, jobId }) {
  // A run whose server stopped is recorded as failed once it is past the
  // deadline, so the page polling it is told instead of waiting for ever.
  await failAbandonedJobs({ orgId, jobId });

  const job = await GenerationJob.findOne({ _id: jobId, orgId }).lean();
  if (!job) throw AppError.notFound('Job not found');

  return {
    id: String(job._id),
    rosterId: String(job.rosterId),
    status: job.status,
    progress: job.progress,
    metrics: job.metrics,
    error: job.error,
  };
}
