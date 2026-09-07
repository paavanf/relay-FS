// shiftTemplate.controller.js
// HTTP layer for shift templates. Thin: parse, call service, respond.

import {
  listShiftTemplates,
  createShiftTemplate,
  updateShiftTemplate,
  deleteShiftTemplate,
} from '../services/shiftTemplate/shiftTemplate.service.js';

export async function list(req, res) {
  const templates = await listShiftTemplates(req.orgId);
  res.json({ templates });
}

export async function create(req, res) {
  const template = await createShiftTemplate(req.orgId, req.valid.body);
  res.status(201).json({ template });
}

export async function update(req, res) {
  const template = await updateShiftTemplate(req.orgId, req.params.templateId, req.valid.body);
  res.json({ template });
}

export async function remove(req, res) {
  await deleteShiftTemplate(req.orgId, req.params.templateId);
  res.status(204).end();
}
