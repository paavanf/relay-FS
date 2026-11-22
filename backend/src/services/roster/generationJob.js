// generationJob.js
// One generation run in the background, after startGeneration has answered:
// mark the job running, load what the engine needs, run it on the worker
// thread within its time and iteration budget, write the roster, and record
// how it went. A failure is always recorded, and the worker and the
// organisation's claim are always given back. If the server itself stops
// part-way nothing here can say so: the claim runs out at the run deadline,
// and the job is recorded as failed then (abandonedJobs.js).

import { GenerationJob } from '../../models/index.js';
import { logger } from '../../utils/logger.js';
import { runGeneration, releaseWorker } from '../../jobs/runGeneration.js';
import { releaseGeneration } from './generationClaim.js';
import { loadGenerationInput } from './loadGenerationInput.service.js';
import { writeGeneratedRoster } from './writeAssignments.service.js';

const GENERATION_BUDGET_MS = 25_000;
const MAX_ITERATIONS = 20_000;

export async function runGenerationJob({ job, org, roster, seed, claimedAt }) {
  try {
    await GenerationJob.updateOne(
      { _id: job._id },
      { $set: { status: 'running', startedAt: new Date() } },
    );

    const input = await loadGenerationInput({ org, roster });

    const result = await runGeneration(
      {
        ...input,
        seed: seed ?? Date.now() % 1_000_000,
        deadlineMs: GENERATION_BUDGET_MS,
        maxIterations: MAX_ITERATIONS,
      },
      (percent) => {
        GenerationJob.updateOne({ _id: job._id }, { $set: { progress: percent } }).catch(() => {});
      },
    );

    await writeGeneratedRoster({
      rosterId: roster._id,
      orgId: org._id,
      assignments: result.assignments,
      unfilledSlots: result.unfilledSlots,
    });

    await GenerationJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: 'completed',
          progress: 100,
          metrics: result.metrics,
          finishedAt: new Date(),
        },
      },
    );

    logger.info({ jobId: String(job._id), ...result.metrics }, 'Generation completed');
  } catch (err) {
    // A job left in `running` would leave its page waiting, so failure has to
    // be recorded whatever went wrong.
    await GenerationJob.updateOne(
      { _id: job._id },
      { $set: { status: 'failed', error: err.message, finishedAt: new Date() } },
    ).catch(() => {});

    logger.error({ jobId: String(job._id), err: err.message }, 'Generation failed');
  } finally {
    // However it ended, the worker and the organisation are free again.
    releaseWorker();
    await releaseGeneration(org._id, claimedAt).catch(() => {});
  }
}
