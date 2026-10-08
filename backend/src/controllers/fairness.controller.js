// fairness.controller.js
// HTTP glue for the fairness ledger. Who may see which figures is decided in
// the service, not here, so no route can forget to apply it.

import { getFairness, recomputeLedger } from '../services/fairness/index.js';

export async function show(req, res) {
  res.json(await getFairness({ orgId: req.orgId, membership: req.membership }));
}

// Managers and owners only (the route checks), so the fresh ledger comes back
// in full, the same shape as GET.
export async function recompute(req, res) {
  await recomputeLedger({ orgId: req.orgId });
  res.json(await getFairness({ orgId: req.orgId, membership: req.membership }));
}
