// qualifications.js
// API calls for qualifications (skills a shift can require).
// Each returns the inner array/object so components do not unwrap twice.

import { api } from '../../../lib/apiClient.js';

export async function listQualifications(orgId) {
  const result = await api.get(`/orgs/${orgId}/qualifications`);
  return result.qualifications;
}

export async function createQualification(orgId, data) {
  const result = await api.post(`/orgs/${orgId}/qualifications`, data);
  return result.qualification;
}

export async function updateQualification(orgId, qualId, data) {
  const result = await api.patch(`/orgs/${orgId}/qualifications/${qualId}`, data);
  return result.qualification;
}

export async function deleteQualification(orgId, qualId) {
  return api.delete(`/orgs/${orgId}/qualifications/${qualId}`);
}
