// qualification.controller.js
// HTTP layer for qualifications. Thin: parse, call service, respond.
//
// req.orgId comes from resolveMembership, which has already confirmed the
// caller belongs to this organisation.

import {
  listQualifications,
  createQualification,
  updateQualification,
  deleteQualification,
} from '../services/qualification/qualification.service.js';

export async function list(req, res) {
  const qualifications = await listQualifications(req.orgId);
  res.json({ qualifications });
}

export async function create(req, res) {
  const qualification = await createQualification(req.orgId, req.valid.body);
  res.status(201).json({ qualification });
}

export async function update(req, res) {
  const qualification = await updateQualification(
    req.orgId,
    req.params.qualId,
    req.valid.body,
  );
  res.json({ qualification });
}

export async function remove(req, res) {
  await deleteQualification(req.orgId, req.params.qualId);
  res.status(204).end();
}
