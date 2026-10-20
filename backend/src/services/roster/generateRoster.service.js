// generateRoster.service.js
// Starts a generation run and returns a job id straight away.
//
// The request must not wait for the work - it takes tens of seconds - so this
// creates a GenerationJob, hands the payload to a worker thread
// (generationJob.js), and returns. The client polls the job.
//
// Two refusals worth understanding:
//   a published roster is never regenerated in place. People have arranged
//   childcare around it. Clone it to a new draft instead.
//   one run per organisation at a time, because the worker pool is one.

import { Roster, GenerationJob, Organisation } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { hasCapacity } from '../../jobs/runGeneration.js';
import { runGenerationJob } from './generationJob.js';

export async function startGeneration({ orgId, rosterId, membershipId, seed }) {
  const roster = await Roster.findOne({ _id: rosterId, orgId });
  if (!roster) throw AppError.notFound('Roster not found');

  if (roster.status !== 'draft') {
    throw AppError.conflict(
      `This roster is ${roster.status}. Published rosters cannot be regenerated - clone it to a new draft first.`,
    );
  }

  const inFlight = await GenerationJob.findOne({ orgId, status: { $in: ['queued', 'running'] } });
  if (inFlight) {
    throw AppError.conflict('A generation is already running for this organisation.');
  }

  if (!hasCapacity()) {
    throw AppError.tooManyRequests('The generator is busy. Try again in a moment.');
  }

  const org = await Organisation.findById(orgId).lean();
  if (!org) throw AppError.notFound('Organisation not found');

  const job = await GenerationJob.create({ orgId, rosterId, requestedBy: membershipId });

  // Deliberately not awaited: the caller gets the job id now and polls.
  runGenerationJob({ job, org, roster, seed });

  return job;
}

export async function getJob({ orgId, jobId }) {
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
