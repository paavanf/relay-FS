// coverage.controller.js
// HTTP layer for coverage requirements. Thin: parse, call service, respond.

import {
  listCoverage,
  upsertCoverage,
  deleteCoverage,
} from '../services/coverage/coverage.service.js';

export async function list(req, res) {
  const coverage = await listCoverage(req.orgId);
  res.json({ coverage });
}

export async function upsert(req, res) {
  const coverage = await upsertCoverage(req.orgId, req.valid.body);
  res.json({ coverage });
}

export async function remove(req, res) {
  await deleteCoverage(req.orgId, req.params.coverageId);
  res.status(204).end();
}
