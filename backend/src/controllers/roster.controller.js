// roster.controller.js
// HTTP layer for roster generation. Thin: parse, call service, respond.

import { startGeneration, getJob } from '../services/roster/index.js';

export async function generate(req, res) {
  const job = await startGeneration({
    orgId: req.orgId,
    rosterId: req.valid.params.rosterId,
    membershipId: req.membership._id,
    seed: req.valid.body?.seed,
  });

  // 202, not 201: the work has been accepted and is running elsewhere. The
  // roster does not exist in its new form yet.
  res.status(202).json({ jobId: String(job._id), status: job.status });
}

export async function showJob(req, res) {
  res.json(await getJob({ orgId: req.orgId, jobId: req.valid.params.jobId }));
}
