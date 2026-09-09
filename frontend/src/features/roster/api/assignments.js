// assignments.js
// API calls for individual shift assignments.
//
// validateAssignment is a dry run: it answers 200 whether or not the edit is
// legal, so "this breaks minimum rest" arrives as data rather than an error.

import { api } from '../../../lib/apiClient.js';

export async function listAssignments(orgId, { from, to } = {}) {
  const query = new URLSearchParams();
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  query.set('mine', 'true');

  const result = await api.get(`/orgs/${orgId}/assignments?${query}`);
  return result.assignments;
}

export async function createAssignment(orgId, data) {
  const result = await api.post(`/orgs/${orgId}/assignments`, data);
  return result.assignment;
}

export async function updateAssignment(orgId, assignmentId, data) {
  const result = await api.patch(`/orgs/${orgId}/assignments/${assignmentId}`, data);
  return result.assignment;
}

export async function deleteAssignment(orgId, assignmentId) {
  return api.delete(`/orgs/${orgId}/assignments/${assignmentId}`);
}

/** @returns {Promise<{ allowed: boolean, violations: Array }>} */
export async function validateAssignment(orgId, data) {
  return api.post(`/orgs/${orgId}/assignments/validate`, data);
}
