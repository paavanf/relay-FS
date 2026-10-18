// swapRequest.controller.js
// HTTP layer for swap requests and their options. Thin: who may do what is
// decided in the services, so no route can forget to apply it.

import { createSwapRequest, listSwapRequests, cancelSwapRequest, getSwapOptions } from '../services/swap/index.js';

export async function create(req, res) {
  const swapRequest = await createSwapRequest({
    orgId: req.orgId,
    membership: req.membership,
    assignmentId: req.valid.body.assignmentId,
    note: req.valid.body.note,
  });
  res.status(201).json({ swapRequest });
}

export async function list(req, res) {
  res.json({ swapRequests: await listSwapRequests({ orgId: req.orgId, membership: req.membership }) });
}

export async function cancel(req, res) {
  await cancelSwapRequest({ orgId: req.orgId, membership: req.membership, requestId: req.valid.params.requestId });
  res.status(204).end();
}

// Read-only: looking at options changes nothing anywhere.
export async function options(req, res) {
  res.json(await getSwapOptions({ orgId: req.orgId, membership: req.membership, requestId: req.valid.params.requestId }));
}
