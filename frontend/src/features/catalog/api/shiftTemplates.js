// shiftTemplates.js
// API calls for shift templates (reusable shift patterns).
//
// crossesMidnight is never sent: the server works it out from the times, and
// the request schema rejects it.

import { api } from '../../../lib/apiClient.js';

export async function listShiftTemplates(orgId) {
  const result = await api.get(`/orgs/${orgId}/shift-templates`);
  return result.templates;
}

export async function createShiftTemplate(orgId, data) {
  const result = await api.post(`/orgs/${orgId}/shift-templates`, data);
  return result.template;
}

export async function updateShiftTemplate(orgId, templateId, data) {
  const result = await api.patch(`/orgs/${orgId}/shift-templates/${templateId}`, data);
  return result.template;
}

// Retires the template rather than destroying it, so existing rosters that
// reference it stay readable.
export async function deleteShiftTemplate(orgId, templateId) {
  return api.delete(`/orgs/${orgId}/shift-templates/${templateId}`);
}
