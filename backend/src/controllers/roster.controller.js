// roster.controller.js
// HTTP layer for roster generation. Thin: parse, call service, respond.

import {
  startGeneration,
  getJob,
  listRosters,
  createRoster,
  getRoster,
  publishRoster,
} from '../services/roster/index.js';
import { isManagerRole } from '../utils/roles.js';

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

export async function list(req, res) {
  // Only managers see drafts. A half-finished roster shown to the people in
  // it causes exactly the "am I working Tuesday?" confusion Relay exists to
  // prevent.
  res.json({
    rosters: await listRosters({
      orgId: req.orgId,
      includeDrafts: isManagerRole(req.membership.role),
    }),
  });
}

export async function create(req, res) {
  res.status(201).json({
    roster: await createRoster({
      orgId: req.orgId,
      ...req.valid.body,
      createdBy: req.membership._id,
    }),
  });
}

export async function show(req, res) {
  res.json(
    await getRoster({
      orgId: req.orgId,
      rosterId: req.valid.params.rosterId,
      includeDrafts: isManagerRole(req.membership.role),
    }),
  );
}

export async function publish(req, res) {
  res.json({
    roster: await publishRoster({ orgId: req.orgId, rosterId: req.valid.params.rosterId }),
  });
}
