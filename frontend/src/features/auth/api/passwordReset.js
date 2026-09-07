// passwordReset.js
// API calls for the forgot/reset password flow.

import { api } from '../../../lib/apiClient.js';

export async function requestReset(email) {
  return await api.post('/auth/forgot-password', { email });
}

export async function submitNewPassword(token, password) {
  return await api.post('/auth/reset-password/' + token, { password });
}
